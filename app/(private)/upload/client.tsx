'use client';

import { Button } from '@/components/ui/button';
import { Dropzone } from '@/components/ui/dropzone';
import { Linkedin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserActions } from '@/hooks/useUserActions';
import { useEffect, useState } from 'react';
import { CustomSpinner } from '@/components/CustomSpinner';
import LoadingFallback from '@/components/LoadingFallback';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

type FileState =
  | { status: 'empty' }
  | { status: 'saved'; file: { name: string; url: string; size: number } };

export default function UploadPageClient() {
  const router = useRouter();

  const { resumeQuery, uploadResumeMutation } = useUserActions();
  const [fileState, setFileState] = useState<FileState>({ status: 'empty' });

  const resume = resumeQuery.data?.resume;

  // Update fileState whenever resume changes
  useEffect(() => {
    if (resume?.file?.url && resume.file.name && resume.file.size) {
      setFileState({
        status: 'saved',
        file: {
          name: resume.file.name,
          url: resume.file.url,
          size: resume.file.size,
        },
      });
    }
  }, [resume]);

  const handleUploadFile = async (file: File) => {
    uploadResumeMutation.mutate(file);
  };

  const handleReset = () => {
    setFileState({ status: 'empty' });
  };

  if (resumeQuery.isLoading) {
    return <LoadingFallback message="Loading..." />;
  }

  const isUpdating = resumeQuery.isPending || uploadResumeMutation.isPending;

  return (
    <div className="flex flex-col items-center flex-1 px-4 py-12 gap-6">
      <div className="w-full max-w-[438px] text-center font-mono">
        <h1 className="text-base text-center pb-6">
          Upload a PDF of your LinkedIn or your resume and generate your
          personal site
        </h1>

        {resume?.resumeData && (
          <div className="mb-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/preview')}
            >
              Go to Preview
            </Button>
          </div>
        )}

        <div className="relative mx-2.5">
          {fileState.status !== 'empty' && (
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full z-10"
              disabled={isUpdating}
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}

          <Dropzone
            accept={{ 'application/pdf': ['.pdf'] }}
            maxFiles={1}
            icon={
              fileState.status !== 'empty' ? (
                <img src="/uploaded-pdf.svg" className="h-6 w-6" />
              ) : (
                <Linkedin className="h-6 w-6 text-gray-600" />
              )
            }
            title={
              <span className="text-base font-bold text-center text-design-black">
                {fileState.status !== 'empty'
                  ? fileState.file.name
                  : 'Upload PDF'}
              </span>
            }
            description={
              <span className="text-xs font-light text-center text-design-gray">
                {fileState.status !== 'empty'
                  ? `${(fileState.file.size / 1024 / 1024).toFixed(2)} MB`
                  : 'Resume or LinkedIn'}
              </span>
            }
            isUploading={uploadResumeMutation.isPending}
            onDrop={(acceptedFiles) => {
              if (acceptedFiles[0]) handleUploadFile(acceptedFiles[0]);
            }}
            onDropRejected={() => toast.error('Only PDF files are supported')}
          />
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="mt-3 hover:bg-white border border-transparent hover:border-gray-200 font-mono text-center cursor-help flex flex-row gap-1.5 justify-center mx-auto"
            >
              <span className="ml-1 inline-block w-4 h-4 rounded-full border border-gray-300 items-center justify-center text-xs cursor-help">
                i
              </span>
              <p className="text-xs text-center text-design-gray whitespace-normal">
                How to upload LinkedIn profile
              </p>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-[652px] text-center font-mono !p-0 gap-0">
            <DialogTitle className="font-mono text-base text-center text-design-gray px-7 py-4">
              Go to your profile → Click on “Resources” → Then “Save to PDF”
            </DialogTitle>
            <img src="/linkedin-save-to-pdf.png" className="h-auto w-full" />
          </DialogContent>
        </Dialog>
      </div>
      <div className="font-mono">
        <div className="relative">
          <Button
            className="px-4 py-3 h-auto bg-design-black hover:bg-design-black/95"
            disabled={fileState.status === 'empty' || isUpdating}
            onClick={() => router.push('/pdf')}
          >
            {isUpdating ? (
              <>
                <CustomSpinner className="h-5 w-5 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <img
                  src="/sparkle.png"
                  alt="Sparkle Icon"
                  className="h-5 w-5 mr-2"
                />
                Generate Website
              </>
            )}
          </Button>
          {fileState.status === 'empty' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="absolute inset-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload a PDF to continue</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
