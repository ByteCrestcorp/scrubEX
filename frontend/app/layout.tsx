import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApiConfigLogger } from "@/components/api-config-logger";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScrubEX — Strip hidden metadata before sharing.",
  description:
    "Strip hidden metadata from images and PDFs before sharing. No accounts, no tracking, files processed temporarily.",
  openGraph: {
    siteName: "ScrubEX",
    title: "ScrubEX — Strip hidden metadata before sharing.",
    description:
      "Remove EXIF, GPS, author tags, and timestamps from your files before you send them.",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ApiConfigLogger />
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
