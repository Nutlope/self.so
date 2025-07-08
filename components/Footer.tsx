export function Footer() {
  return (
    <footer className="w-full py-4 px-6  mt-auto border-t border-border">
      <div className="max-w-4xl justify-between items-center mx-auto w-full flex flex-col-reverse md:flex-row gap-2">
        <div className="text-sm text-muted-foreground font-mono font-bold">
          Powered by{' '}
          <a
            target="_blank"
            href="https://togetherai.link"
            className="text-foreground underline underline-offset-2"
          >
            Together.ai
          </a>{' '}
          &{' '}
          <a
            target="_blank"
            href="https://togetherai.link"
            className="text-foreground underline underline-offset-2"
          >
            Llama 3.3
          </a>
        </div>

        <div className="flex gap-2">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/Nutlope/self.so"
            className="size-6 flex items-center justify-center border-border border rounded-md"
          >
            <img src="/footer/github.svg" className="size-4 dark:invert" />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://x.com/nutlope"
            className="size-6 flex items-center justify-center border-border border rounded-md"
          >
            <img src="/footer/x.svg" className="size-4 dark:invert" />
            <span className="sr-only">Social</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
