import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Show, UserButton } from '@clerk/nextjs';

export function TopMenu() {
  return (
    <>
      <header className="w-full py-4 md:px-0 px-6 flex justify-between items-center max-w-4xl mx-auto h-[67px]">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Self.so Logo" className="h-[30px] w-auto" />
        </Link>

        <div>
          <Show when="signed-in">
            {/* User is signed in */}
            <UserButton />
          </Show>
          <Show when="signed-out">
            <div className="flex flex-row gap-3 font-mono ">
              <a
                href="https://github.com/nutlope/self.so"
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  variant="outline"
                  className=" flex flex-row gap-1.5 py-2 px-4 border-gray-300 text-design-gray text-sm font-medium"
                >
                  <img
                    src="/github.svg"
                    alt="Github Logo"
                    className="size-[14px]"
                  />
                  <span>Github</span>
                </Button>
              </a>
              <Link href="/upload">
                <Button
                  variant="default"
                  className="text-sm font-medium py-2 px-4 bg-design-black hover:bg-design-black/95"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          </Show>
        </div>
      </header>
    </>
  );
}
