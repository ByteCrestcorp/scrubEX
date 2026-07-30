"""Capability tokens and report hashing. Implemented in P1.

``review_token`` is the only access control a job has, because no accounts
exist -- holding it *is* the authorisation. 256-bit CSPRNG, base64url, issued
once in the upload-complete response body, **stored hashed only**, compared on
every call, never in a URL or query string because Cloudflare logs those
(invariant 7). No revocation endpoint: key expiry makes the token meaningless.

``report_hash`` is *not* an access control. It proves the client fetched the
current report before requesting a clean, which is the technical enforcement of
the reveal-before-clean promise. Computed server-side, compared byte for byte.
"""
