'use client';

import { Button } from '@/components/ui/button';
import { cn, getSelfSoUrl } from '@/lib/utils';
import { ExternalLink, Pencil,QrCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import UsernameEditorView from './UsernameEditorView';
import QRCode from 'qrcode';

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


  const handleQRDownload = async () => {
    if (!initialUsername || status !== 'live') return;

    const portfolioUrl = getSelfSoUrl(initialUsername);
    console.log(portfolioUrl)
    const canvas = document.createElement('canvas');

    await QRCode.toCanvas(canvas, portfolioUrl, { width: 300 });

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `${initialUsername}-qr.png`;
    link.click();
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

          <div className="overflow-hidden rounded bg-white border-[0.5px] border-neutral-300 flex flex-row w-80">
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
              <div
                className="size-1.5 rounded-full"
                style={{
                  backgroundColor: status === 'draft' ? '#B98900' : '#009505',
                }}
              />
              <p
                className={cn(
                  'text-[10px] font-bold uppercase',
                  status === 'draft' ? 'text-[#B98900]' : 'text-[#009505]'
                )}
              >
                {status}
              </p>
            </div>

            <Button
              key={status}
              variant={'default'}
              disabled={isChangingStatus}
              onClick={handleStatusChange}
              className={`flex items-center min-w-[100px] min-h-8 gap-1.5 px-3 py-1.5 h-auto ${
                status === 'draft'
                ? 'bg-design-black hover:bg-[#333333] text-[#fcfcfc]'
                : 'bg-design-white text-design-black hover:bg-gray-100'
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
              <Button
                onClick={handleQRDownload}
                className="flex items-center gap-2 bg-white border text-black hover:bg-gray-100 min-h-8 px-3 py-1.5"
              >
                <QrCode className="w-6 h-6 text-gray-600" />
                QR
              </Button>
            )}


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
