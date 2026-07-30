import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const y = new Date().getFullYear();
  return (
    <footer className="mt-auto relative z-10 w-full">
      <div className="border-t border-border-default/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-4 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="ScrubEX"
                  width={24}
                  height={24}
                />
                <p className="text-text-faint text-xs font-medium tracking-wide">
                  © {y} ByteCrest Corp · ScrubEX
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-medium">
              <Link
                href="/privacy"
                className="text-text-muted hover:text-text-heading transition-colors duration-200"
              >
                Privacy Model
              </Link>
              <Link
                href="/tools/scrubex"
                className="text-text-muted hover:text-text-heading transition-colors duration-200"
              >
                Scrub a file
              </Link>
            </div>
          </div>
          <p className="text-text-faint text-xs text-center sm:text-left mt-4 max-w-md mx-auto sm:mx-0 sm:ml-8">
            Private tools. Nothing collected.
          </p>
        </div>
      </div>
    </footer>
  );
}
