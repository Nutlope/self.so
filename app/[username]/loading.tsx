export default function LoadingUsernamePage() {
  return (
    <section
      className="mx-auto w-full max-w-2xl space-y-8 bg-background print:bg-white print:space-y-4 my-8 px-4"
      aria-label="Resume Content"
    >
      <header className="flex items-center justify-between">
        <div className="flex-1 space-y-1.5">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="flex gap-x-1 pt-1">
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-28 w-28 bg-muted rounded-full animate-pulse" />
      </header>

      <div className="flex flex-col gap-6">
        <section className="flex min-h-0 flex-col gap-y-3">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="h-20 w-full bg-muted rounded animate-pulse" />
        </section>
      </div>
    </section>
  );
}
