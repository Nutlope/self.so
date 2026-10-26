import Link from 'next/link';

export default function RateLimitedMessage() {
  return (
    <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
      <p className="font-mono max-w-[400px] text-center text-lg">
        You&apos;ve processed too many resumes recently. Please try again later.
      </p>
      <Link href="/upload" className="font-mono text-sm underline">
        Back to upload
      </Link>
    </div>
  );
}
