'use client';

import { Button } from '@/components/ui/button';
import { cn, getSelfSoUrl } from '@/lib/utils';
import { ExternalLink, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import UsernameEditorView from './UsernameEditorView';

export type PublishStatuses = 'draft' | 'live';

export default function PreviewActionbar({
  initialUsername = '',
  prefix = 'self.so/',
  status,
  onStatusChange,
  isChangingStatus,
}: {
  initialUsername: string;
  prefix?: string;
  status?: PublishStatuses;
  onStatusChange?: (newStatus: PublishStatuses) => Promise<void>;
  isChangingStatus?: boolean;
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleStatusChange = async () => {
    if (onStatusChange) {
      // Toggle the status
      const newStatus = status === 'draft' ? 'live' : 'draft';
      await onStatusChange(newStatus);
    }
  };

  return (
    <>
      <div className="w-full rounded-lg bg-[#fcfcfc] border-[0.5px] border-neutral-300 flex items-center justify-between py-3 px-5  sm:px-4 sm:py-2.5  flex-col sm:flex-row gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="flex items-center gap-1 mr-1">
            <img
              src="/link-icon.png"
              className={cn(
                'w-4 h-4 text-design-black ',
                status === 'live' && 'cursor-pointer'
              )}
              onClick={() => {
                if (!initialUsername || status !== 'live') return;
                const portofolioUrl = getSelfSoUrl(initialUsername);
                navigator.clipboard.writeText(portofolioUrl);
                toast.success('Copied link to your website');
              }}
            />
            <p className="text-sm text-design-black">{prefix}</p>
          </div>

          <div className="overflow-hidden rounded bg-white border-[0.5px] border-neutral-300 flex flex-row md:w-80 w-full">
            <span className="flex-1 p-3 text-sm text-[#5d5d5d] border-none outline-none focus:ring-0 bg-transparent w-fit truncate">
              {initialUsername}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="size-[44px] flex items-center justify-center border-l-[0.5px]"
              onClick={() => setIsEditorOpen(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {status === 'live' ? (
                <button
                  onClick={() =>
                    window.open(getSelfSoUrl(initialUsername), '_blank')
                  }
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <div
                    className="size-1.5 rounded-full relative"
                    style={{
                      backgroundColor: '#009505',
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-[#009505] animate-ping opacity-50" />
                  </div>
                  <p className="text-[10px] font-bold uppercase text-[#009505]">
                    {status}
                  </p>
                </button>
              ) : (
                <>
                  <div
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: '#B98900',
                    }}
                  />
                  <p className="text-[10px] font-bold uppercase text-[#B98900]">
                    {status}
                  </p>
                </>
              )}
            </div>

            <Button
              key={status}
              variant={'default'}
              disabled={isChangingStatus}
              onClick={handleStatusChange}
              className={`flex items-center min-w-[100px] min-h-8 gap-1.5 px-3 py-1.5 h-auto ${
                status === 'draft'
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {isChangingStatus ? (
                <>
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                </>
              ) : (
                <span className="text-sm">
                  {status === 'draft' ? 'Publish' : 'Unpublish'}
                </span>
              )}
            </Button>
            {status === 'live' && (
              <Button className="flex items-center min-w-[100px] min-h-8 gap-1.5 px-3 py-1.5 h-auto">
                <a
                  href={`${getSelfSoUrl(initialUsername)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit Site
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <UsernameEditorView
        initialUsername={initialUsername}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        prefix={prefix}
      />
    </>
  );
}
