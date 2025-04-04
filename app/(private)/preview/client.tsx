'use client';
import LoadingFallback from '@/components/LoadingFallback';
import { PopupSiteLive } from '@/components/PopupSiteLive';
import PreviewActionbar from '@/components/PreviewActionbar';
import { FullResume } from '@/components/resume/FullResume';
import { useUserActions } from '@/hooks/useUserActions';
import { getSelfSoUrl } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

export default function PreviewClient() {
  const { user } = useUser();
  const { resumeQuery, toggleStatusMutation, usernameQuery } = useUserActions();
  const [showModalSiteLive, setModalSiteLive] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const queryClient = useQueryClient();

  if (resumeQuery.isLoading || usernameQuery.isLoading || !usernameQuery.data) {
    return <LoadingFallback message="Loading..." />;
  }

  // Handle CTA changes
  const handleCtaChange = async (
    cta: { label: string; url: string } | undefined
  ) => {
    const resumeData = resumeQuery.data?.resume?.resumeData;
    if (!resumeQuery.data?.resume || !resumeData || !resumeData.header) return;

    const updatedResume = {
      ...resumeQuery.data.resume,
      resumeData: {
        ...resumeData,
        header: {
          ...resumeData.header,
          cta: cta,
        },
      },
    };

    try {
      // Optimistically update the cache
      queryClient.setQueryData(['resume'], {
        resume: updatedResume,
      });

      // Send update to server
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedResume),
      });

      if (!response.ok) {
        throw new Error('Failed to update resume');
      }

      toast.success('CTA updated successfully');
      setIsEditMode(false);
    } catch (error) {
      // Revert to original data on error
      queryClient.setQueryData(['resume'], resumeQuery.data);
      toast.error('Failed to update CTA');
    }
  };

  const CustomLiveToast = () => (
    <div className="w-fit min-w-[360px] h-[44px] items-center justify-between relative rounded-md bg-[#eaffea] border border-[#009505] shadow-md flex flex-row gap-2 px-2">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        preserveAspectRatio="none"
      >
        <rect width="24" height="24" rx="4" fill="#EAFFEA"></rect>
        <path
          d="M16.6668 8.5L10.2502 14.9167L7.3335 12"
          stroke="#009505"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </svg>
      <p className="text-sm text-left text-[#003c02] mr-2">
        <span className="hidden md:block"> Your website has been updated!</span>
        <span className="md:hidden"> Website updated!</span>
      </p>
      <a
        href={getSelfSoUrl(usernameQuery.data.username)}
        target="_blank"
        className="flex justify-center items-center overflow-hidden gap-1 px-3 py-1 rounded bg-[#009505] h-[26px]"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-grow-0 flex-shrink-0 w-2.5 h-2.5 relative"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M6.86768 2.39591L1.50684 7.75675L2.2434 8.49331L7.60425 3.13248V7.60425H8.64591V1.35425H2.39591V2.39591H6.86768Z"
            fill="white"
          ></path>
        </svg>
        <p className="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-white">
          View
        </p>
      </a>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-background flex flex-col gap-4 pb-8">
      <div className="max-w-3xl mx-auto w-full md:px-0 px-4">
        <PreviewActionbar
          initialUsername={usernameQuery.data.username}
          status={resumeQuery.data?.resume?.status}
          onStatusChange={async (newStatus) => {
            await toggleStatusMutation.mutateAsync(newStatus);
            const isFirstTime = !localStorage.getItem('publishedSite');

            if (isFirstTime && newStatus === 'live') {
              setModalSiteLive(true);
              localStorage.setItem('publishedSite', new Date().toDateString());
            } else {
              if (newStatus === 'draft') {
                toast.warning('Your website has been unpublished');
              } else {
                toast.custom((t) => <CustomLiveToast />);
              }
            }
          }}
          isChangingStatus={toggleStatusMutation.isPending}
        />

        {/* CTA Edit Toggle Button */}
        <div className="flex justify-end mt-2">
          <button
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? (
              <>Done Editing</>
            ) : (
              <>
                {resumeQuery.data?.resume?.resumeData?.header?.cta?.label
                  ? 'Edit Call-to-Action Button'
                  : 'Add Call-to-Action Button'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full md:rounded-lg border-[0.5px] border-neutral-300 flex items-center justify-between px-4">
        <FullResume
          resume={resumeQuery.data?.resume?.resumeData}
          profilePicture={user?.imageUrl}
          allSkills={resumeQuery.data?.resume?.resumeData?.header?.skills || []}
          isEditMode={isEditMode}
          onCtaChange={handleCtaChange}
        />
      </div>

      <PopupSiteLive
        isOpen={showModalSiteLive}
        websiteUrl={getSelfSoUrl(usernameQuery.data.username)}
        onClose={() => {
          setModalSiteLive(false);
        }}
      />
    </div>
  );
}
