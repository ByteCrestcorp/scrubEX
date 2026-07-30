"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/tools/scrubex", label: "Scrub a file" },
  { href: "/privacy", label: "Privacy Model" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinkClass = (href: string) =>
    `transition-colors duration-200 ${
      pathname === href
        ? "text-text-heading"
        : "text-text-muted hover:text-text-heading"
    }`;

  return (
    <nav className="border-b border-border-default/50 bg-bg-deep/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="ScrubEX"
              width={36}
              height={36}
              priority
            />
            <span className="font-semibold text-lg tracking-tight text-text-heading">
              ScrubEX
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-[13px] font-medium">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-text-muted hover:text-text-heading transition-colors rounded-lg hover:bg-surface-deep/60"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="md:hidden overflow-hidden border-t border-border-default/50 bg-bg-deep/95 backdrop-blur-xl"
          >
            <div className="px-5 py-4 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    pathname === link.href
                      ? "text-text-heading bg-surface-deep/60"
                      : "text-text-body hover:text-text-heading hover:bg-surface-deep/60"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
