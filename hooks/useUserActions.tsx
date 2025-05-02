import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Resume, ResumeData } from '@/lib/server/redisActions';
import { useS3Upload } from 'next-s3-upload';
import { PublishStatuses } from '@/components/PreviewActionbar';
import { ResumeDataSchema } from '@/lib/resume';

// Fetch resume data
const fetchResume = async (): Promise<{
  resume: Resume | undefined;
}> => {
  const response = await fetch('/api/resume');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch resume');
  }
  return await response.json();
};

const fetchUsername = async (): Promise<{
  username: string;
}> => {
  const response = await fetch('/api/username');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch username');
  }
  return await response.json();
};

const checkUsernameAvailability = async (
  username: string
): Promise<{
  available: boolean;
}> => {
  const response = await fetch(
    `/api/check-username?username=${encodeURIComponent(username)}`,
    {
      method: 'POST',
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check username availability');
  }
  return await response.json();
};

export function useUserActions() {
  const queryClient = useQueryClient();
  const { uploadToS3 } = useS3Upload();

  // Query for fetching resume data
  const resumeQuery = useQuery({
    queryKey: ['resume'],
    queryFn: fetchResume,
  });

  const usernameQuery = useQuery({
    queryKey: ['username'],
    queryFn: fetchUsername,
  });

  const internalResumeUpdate = async (newResume: Resume) => {
    const response = await fetch('/api/resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newResume),
    });

    if (!response.ok) {
      const error = await response.json();
      return Promise.reject(new Error(error));
    }
  };

  const internalUsernameUpdate = async (newUsername: string) => {
    const response = await fetch('/api/username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: newUsername }),
    });

    if (!response.ok) {
      const error = await response.json();
      return Promise.reject(error);
    }

    return {
      success: true,
    };
  };

  // Update resume data in Upstash
  const uploadFileResume = async (file: File) => {
    // Get current resume data
    const currentResume = await fetchResume();
    
    // If there's an existing file, delete it from S3
    if (currentResume.resume?.file?.bucket && currentResume.resume?.file?.key) {
      try {
        await fetch('/api/delete-s3', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucket: currentResume.resume.file.bucket,
            key: currentResume.resume.file.key,
          }),
        });
      } catch (error) {
        console.error('Error deleting previous file:', error);
        // Continue with upload even if deletion fails
      }
    }

    const fileOnS3 = await uploadToS3(file);

    const newResume: Resume = {
      file: {
        name: file.name,
        url: fileOnS3.url,
        size: file.size,
        bucket: fileOnS3.bucket,
        key: fileOnS3.key,
      },
      resumeData: undefined,
      status: 'draft',
    };

    queryClient.setQueryData(['resume'], (oldData: any) => ({
      ...oldData,
      ...newResume,
    }));

    await internalResumeUpdate(newResume);
  };

  // Mutation for updating resume
  const uploadResumeMutation = useMutation({
    mutationFn: uploadFileResume,
    onSuccess: () => {
      // Invalidate and refetch resume data
      queryClient.invalidateQueries({ queryKey: ['resume'] });
    },
  });

  // Mutation for toggling status of publishment
  const toggleStatusMutation = useMutation({
    mutationFn: async (newPublishStatus: PublishStatuses) => {
      if (!resumeQuery.data?.resume) return;
      await internalResumeUpdate({
        ...resumeQuery.data?.resume,
        status: newPublishStatus,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch resume data
      queryClient.invalidateQueries({ queryKey: ['resume'] });
    },
  });

  // mutation to allow editing a username for a user_id, if it fails means that username is already taken
  const updateUsernameMutation = useMutation({
    mutationFn: internalUsernameUpdate,
    onSuccess: () => {
      // Invalidate and refetch username data
      queryClient.invalidateQueries({ queryKey: ['username'] });
    },
    throwOnError: false,
  });

  // Mutation for checking username availability
  const checkUsernameMutation = useMutation({
    mutationFn: checkUsernameAvailability,
    onSuccess: () => {
      // Invalidate and refetch username availability data
      queryClient.invalidateQueries({ queryKey: ['username-availability'] });
    },
  });

  // Function to save resume data changes
  const saveResumeDataChanges = async (newResumeData: ResumeData) => {
    // Validate the resume data using Zod schema
    try {
      // Validate the resume data
      ResumeDataSchema.parse(newResumeData);

      // If validation passes, update the resume
      if (!resumeQuery.data?.resume) {
        throw new Error('No resume found to update');
      }

      const updatedResume: Resume = {
        ...resumeQuery.data.resume,
        resumeData: newResumeData,
      };

      await internalResumeUpdate(updatedResume);

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  };

  // Mutation for saving resume data changes
  const saveResumeDataMutation = useMutation({
    mutationFn: saveResumeDataChanges,
    onSuccess: () => {
      // Invalidate and refetch resume data
      queryClient.invalidateQueries({ queryKey: ['resume'] });
    },
  });

  return {
    resumeQuery,
    uploadResumeMutation,
    toggleStatusMutation,
    usernameQuery,
    updateUsernameMutation,
    checkUsernameMutation,
    saveResumeDataMutation,
  };
}
