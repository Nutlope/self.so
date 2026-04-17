import { auth } from '@clerk/nextjs/server';
import PreviewClient from './client';
import {
  createUsernameLookup,
  getResume,
  getUsernameById,
  storeResume,
} from '../../../lib/server/redisActions';
import { generateResumeObject } from '@/lib/server/ai/generateResumeObject';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import LoadingFallback from '../../../components/LoadingFallback';
import { MAX_USERNAME_LENGTH } from '@/lib/config';
import { currentUser } from '@clerk/nextjs/server';

async function LLMProcessing({ userId }: { userId: string }) {
  console.log('[Preview] Starting LLMProcessing for userId:', userId);

  const user = await currentUser();
  console.log('[Preview] Got currentUser:', user?.id);

  let resume = await getResume(userId);
  console.log('[Preview] Got resume:', resume ? 'exists' : 'none');

  if (!resume?.fileContent || !resume.file) {
    console.log('[Preview] No fileContent or file, redirecting to upload');
    redirect('/upload');
  }

  let messageTip: string | undefined;

  if (!resume.resumeData) {
    console.log('[Preview] No resumeData, calling generateResumeObject...');
    let resumeObject = await generateResumeObject(resume?.fileContent);
    console.log('[Preview] generateResumeObject completed:', resumeObject ? 'success' : 'failed');

    if (!resumeObject) {
      messageTip =
        "We couldn't extract data from your PDF. Please edit your resume manually.";
      resumeObject = {
        header: {
          name:
            user?.fullName || user?.emailAddresses[0]?.emailAddress || 'user',
          shortAbout: 'This is a short description of your profile',
          location: '',
          contacts: {},
          skills: ['Add your skills here'],
        },
        summary: 'You should add a summary here',
        workExperience: [],
        education: [],
      };
    }

    console.log('[Preview] Storing resume with resumeData...');
    await storeResume(userId, {
      ...resume,
      resumeData: resumeObject,
    });
    resume.resumeData = resumeObject;
    console.log('[Preview] Resume stored successfully');
  }

  // we set the username only if it wasn't already set for this user meaning it's new user
  const foundUsername = await getUsernameById(userId);
  console.log('[Preview] Found username:', foundUsername);

  const saltLength = 6;

  const createSalt = () =>
    Math.random()
      .toString(36)
      .substring(2, 2 + saltLength);

  if (!foundUsername) {
    const username =
      (
        (resume.resumeData.header.name || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-') + '-'
      ).slice(0, MAX_USERNAME_LENGTH - saltLength) + createSalt();

    console.log('[Preview] Creating username:', username);
    const creation = await createUsernameLookup({
      userId,
      username,
    });

    if (!creation) redirect('/upload?error=usernameCreationFailed');
  }

  console.log('[Preview] Rendering PreviewClient');
  return <PreviewClient messageTip={messageTip} />;
}

export default async function Preview() {
  console.log('[Preview] Page started');
  const { userId, redirectToSignIn } = await auth();
  console.log('[Preview] Auth completed, userId:', userId);

  if (!userId) {
    console.log('[Preview] No userId, redirecting to sign in');
    return redirectToSignIn();
  }

  return (
    <>
      <Suspense
        fallback={
          <LoadingFallback message="Creating your personal website..." />
        }
      >
        <LLMProcessing userId={userId} />
      </Suspense>
    </>
  );
}

export const maxDuration = 40;
