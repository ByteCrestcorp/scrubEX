import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScrubEX — Privacy Model",
  description: "What ScrubEX does and does not do with the files you upload.",
};

export default function PrivacyPage() {
  return (
    <div className="flex-1 max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-14 md:py-20 w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-heading mb-3">
        Privacy Model
      </h1>
      <p className="text-text-muted leading-relaxed mb-10">
        ScrubEX is built on one rule: process what the task requires, keep
        nothing longer than necessary.
      </p>

      <div className="space-y-8 text-text-body leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text-heading mb-2">
            What happens to your file
          </h2>
          <p>
            Uploaded files are held in Redis with a short time-to-live —
            never written to disk. Once you download the cleaned result, the
            original bytes are deleted immediately. Unclaimed jobs expire
            automatically within minutes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-heading mb-2">
            What we store
          </h2>
          <p>
            MongoDB keeps only a minimal job record — a generated file ID,
            the detected file type and size, a status (pending, inspected,
            stripping, complete, or failed), and an expiry timestamp. No
            filenames, no file contents, no extracted metadata, and no IP
            addresses are ever written to that record.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-heading mb-2">
            No accounts
          </h2>
          <p>
            ScrubEX has no user accounts, profiles, or login. There is
            nothing to tie a scrub job back to an identity.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-heading mb-2">
            Downloads are one-time
          </h2>
          <p>
            Cleaned files are served via a single-use download token. Once
            used, the token and the cleaned bytes are deleted — the link
            cannot be replayed.
          </p>
        </section>
      </div>
    </div>
  );
}
