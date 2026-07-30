import type { Metadata } from "next";
import { MetadataStripperPage } from "./scrubex-client";

export const metadata: Metadata = {
  title: "ScrubEX — Strip Hidden Metadata",
  description:
    "Strip hidden metadata from images and PDFs before sharing. No accounts. Files processed temporarily.",
};

export default function Page() {
  return <MetadataStripperPage />;
}
