# AGENTS.md — ScrubEX

> **Build artifact, derived — not a source of truth.** Every rule here is extracted from `context/blueprint.md`, `context/architecture.md`, `context/security.md`, or `context/phases.md`. If this file ever disagrees with those, they win and this gets re-derived. Nothing here is invented; where a source doc is silent, that is recorded as a gap rather than filled in.
>
> Derived 2026-07-30 from blueprint.md, architecture.md, security.md, phases.md.

## What this product is

ScrubEX removes hidden metadata from files **and shows the user exactly what was there first**. A file is inspected, a report of actual values is returned, and nothing is modified until the user explicitly chooses to strip. Web app and Telegram bot on one shared backend. No account, no sign-up, no login, anywhere, ever.

The public claim is *"we remove all embedded metadata, and we show you proof."* Never *"untraceable."*

The differentiator is not format coverage — three of four surveyed competitors already handle more formats. It is an inspect-first flow with **nothing in the product contradicting its privacy claim.**

## Product principles

Six rules. Anything contradicting one is out of scope regardless of its other merits.

1. Every finding is shown with its actual value, before any action.
2. Stripping requires an explicit user action, every time.
3. Files and reports expire on a stated deadline the user can watch.
4. No account, no tracking, no third-party request from any page handling a file.
5. Limits are published rather than omitted.
6. Both channels are full clients. The Telegram bot is not a demo.

## Scope

**In, v1:** single-file upload with server-side type detection · full inspection report with actual values in three categories · cleaning only on explicit action · verification by a second independent detector · time-limited download with visible expiry · web client and Telegram bot as full clients of one API · published machine-readable coverage manifest · published limits page · donation link kept off every file-handling page.

**Formats, v1:** images (jpg, jpeg, png, webp, gif, tiff, heic/heif) · pdf · docx.

**Out, v1 (deferred, designs stay valid):** video · xlsx, pptx · batch upload · accounts, history, saved files · public API · selective field-level stripping · mobile apps.

**Never (distinct from the deferrals):** accounts in any form · ad-supported revenue · client-side processing · metadata *editing* or writing · claiming untraceability.

## Launch gates

v1 ships only when all ten hold. Each is checkable, not a judgement call.

| | |
| --- | --- |
| G1 | All three formats inspect, clean, verify end to end |
| G2 | Both channels ship against the same API contract |
| G3 | Coverage manifest published, every claim in it tested |
| G4 | Limits page published |
| G5 | Network trace of every file-handling page shows zero third-party requests |
| G6 | A `.docm` renamed to `.docx` is still refused |
| G7 | Files and reports unreachable after TTL; downloading does not extend it |
| G8 | Cleaned DOCX and PDF open correctly with visible content unchanged |
| G9 | Independent pre-launch security audit completed, findings resolved |
| G10 | The three weight-bearing copy items authored and reviewed, not placeholders |

## Invariants — never violate

1. No code path deletes a job record. Expiry is Redis key TTL alone.
2. Redis persistence stays disabled; `maxmemory-policy` stays `noeviction`.
3. The `core` network keeps `internal: true`. Adding external routing to it is a security incident, not a debugging step.
4. No parser is importable inside the API service.
5. No sandbox inherits credentials or network access.
6. One sandbox per job, destroyed on completion or failure, never reused.
7. `review_token` is stored hashed and never appears in a URL, query string, or log.
8. File type comes from magic bytes. Extension and client-declared type are never trusted, on either channel.
9. Macro-enabled Office files are rejected by inspecting zip contents, not the extension.
10. `clean` is legal only from `REVIEWABLE`, and is idempotent.
11. Uploads stream to a bounded sink. The full body is never buffered in memory before the size check.
12. Only `jobs/store.py` accesses Redis. Only `sandbox/runner.py` invokes bubblewrap. Only `config.py` reads secrets.
13. No third-party request originates from any page or flow handling a file.
14. Backups exclude TTL-bound job data.
15. Cleaning never re-renders or re-encodes a document.

## Architecture — boundaries

One stateless job API serves two thin clients. Job state lives in Redis, which also carries per-format queues and admission counters. Format-specialised Celery workers pull jobs and run every parser inside a disposable namespace sandbox with no network. Cleaned output lands on a bounded scratch disk and expires with its Redis key.

Clients always call the API, never a worker. Workers pull from Redis rather than being pushed to.

| Folder | Owns | Does not own |
| --- | --- | --- |
| `api/` | HTTP boundary, admission decisions, state transitions | Parsing. No parser is importable here |
| `jobs/` | Job records, state machine, token issue and compare | HTTP concerns, parsing |
| `detect/` | Type identification from bytes, macro rejection | Metadata extraction |
| `sandbox/` | Namespace confinement and resource caps | Which parser runs, or what it finds |
| `workers/` | Job orchestration per format | Direct parser execution — parsers run inside the sandbox |
| `report/` | Category schema, verification pass | Stripping decisions per format |
| `bot/` | Telegram presentation, per-chat fairness | Job state. It has no Redis access |
| `frontend/lib/api/` | Generated typed client | Business logic |
| `infra/` | Topology, networks, hardening flags | Application behaviour |

**Privilege inversion — do not collapse for convenience.** The process holding credentials cannot parse a hostile file; the process parsing a hostile file holds no credentials.

| Component | Holds Redis credentials | Contains a parser |
| --- | --- | --- |
| `api` | yes | **no** |
| `bot` | no | no |
| Workers | yes | no — parsers run in the sandbox |
| Sandbox | **no** | yes |

## Tech stack

| Layer | Technology | Version |
| --- | --- | --- |
| Edge | Cloudflare | — |
| API | FastAPI + Uvicorn | Python 3.12 |
| Frontend | Next.js App Router + TypeScript | 16.x, Node 20.9+, TS 5.1+, Turbopack |
| Bot | aiogram, long polling | 3.x |
| Queue | Celery + Redis broker | Celery 5.x |
| State | Redis, no persistence | 7.4 |
| Sandbox | bubblewrap | — |
| Image parsing | ExifTool + Pillow | — |
| PDF parsing | pikepdf / qpdf | — |
| Office parsing | python-docx + lxml | — |
| Runtime | Docker + Compose | — |

### Do not use

| Rejected | Why |
| --- | --- |
| MongoDB | Redis per-key TTL makes expiry a database guarantee rather than application code |
| LibreOffice headless | Full open/render/re-save round trip — fidelity risk plus a large legacy parsing surface |
| Arcjet or in-process WAF SDKs | Not an edge service, and its rate limiting reports client fingerprints to a third-party cloud API |
| Cloudflare Stream | A third party would receive and process the user's file |
| Kata / Firecracker | Require nested virtualisation, unavailable on most budget hosts |
| Docker socket mounting | Root-equivalent on the host |
| Server-sent events for status | Holds per-client connection state, buffers badly through Cloudflare |
| pypdf | pikepdf/qpdf is the chosen PDF engine |
| Priority or VIP queues | No identity to attach priority to; a self-declared urgent flag trivially bypasses admission control |
| Any analytics, error-reporting SDK, or embedded third-party widget | Directly contradicts principle 4 and gate G5 |

## Data model

Redis holds every job record, both per-format queues, and all admission counters. Scratch disk holds file bytes only. **There is no relational database and no long-lived store of any kind. No migrations exist, because there is no schema to migrate.**

| Entity | Key fields | Notes |
| --- | --- | --- |
| `job:{job_id}` | status, channel, detected_type, report, report_hash, review_token_hash, output_ref, created_at, expires_at | TTL 15 minutes. Token hash only, never plaintext |
| `upload:{upload_id}` | bytes_received, started_at | Discarded once the job record exists. Drives the client's pre-completion estimate |
| `queue:{format}` | job_id | Job IDs only. Never bytes, metadata, or user identifiers |
| Counters | scope, value, ttl | Per-IP concurrency and rolling quota, global capacity |

**State machine:** `UPLOADING → INSPECTING → REVIEWABLE → CLEANING → VERIFYING → READY / FAILED`. Expiry is implicit via TTL — there is no `EXPIRED` state and no `QUEUED` state.

## API contract

| Route | Method | Token | Request | Response |
| --- | --- | --- | --- | --- |
| `/v1/jobs` | POST | no | multipart file | `job_id`, `review_token`, `expires_at`, `status` |
| `/v1/jobs/{id}` | GET | yes | none | `status`, `expires_at`, `retry_after`, plus `report` and `report_hash` once `REVIEWABLE` |
| `/v1/jobs/{id}/clean` | POST | yes | `report_hash` | `status`, `retry_after` |
| `/v1/jobs/{id}/output` | GET | yes | none | file bytes |
| `/.well-known/scrubex.json` | GET | no | none | coverage manifest |
| `/healthz` | GET | no | none | liveness |

- The API validates **legal state transitions**, not only payload shape.
- `clean` is idempotent: a repeat call with a matching hash while already `CLEANING` returns current state, charges quota once, starts no second sandbox.
- `review_token` travels in a request header on every call. Never a URL or query string — Cloudflare logs query strings.
- **Both clients are generated from this contract.** Hand-writing them is what produced the divergent `/api/v1/scrub` and `/api/scrubex` endpoints in the original codebase.
- The server dictates the poll interval via `retry_after`. Clients obey it.

### Error responses — three buckets, and the distinction is deliberate

| Bucket | Cases | Response |
| --- | --- | --- |
| Admission | per-IP concurrency, quota, global capacity, backlog depth, disk breaker | One generic response plus `retry_after`. **Never says which limit** |
| Request facts | unsupported format, too large, malformed archive, macro-enabled document | **Specific.** Reveals nothing the user could not learn from their own file |
| Job state | not found, expired, wrong token, hash mismatch | One generic response. Distinguishing these would be a job-enumeration oracle |

Bucket three costs no usability: the client already holds `expires_at` and renders "expired, start over" from local knowledge.

## The report — product structure, not a technical detail

| Group | Shown as | Behaviour |
| --- | --- | --- |
| `privacy_metadata` | Found and removed | Stripped on clean |
| `content_annotations` | Found, not removed | Left intact — removal would change visible content |
| `residual_findings` | Cannot be removed | Explained, with the reason |

`file_properties` (dimensions, format, size) appears separately as neutral facts, not findings.

| | |
| --- | --- |
| R1 | Every finding shows its actual value, not a count or bare field name. "GPS: 51.5074, −0.1278", not "location data present" |
| R2 | GPS coordinates rendered legibly, with a plain note that this identifies a physical place |
| R3 | `content_annotations` entries carry "found, not removed — removing this may alter document content" |
| R4 | Every `residual_findings` entry carries a one-line reason. No unexplained entries |
| R5 | A file with no findings says so plainly, without implying failure |
| R6 | The report never truncates silently. If long, it paginates and says so |
| R7 | The verification result is shown after cleaning, including what the second detector found |

## Non-functional requirements

| | |
| --- | --- |
| N1 | Files and reports expire 15 minutes after upload completes. Downloading does not extend it |
| N2 | Remaining time is visible from the moment upload begins |
| N3 | Detection is server-side. Declared type and extension are never trusted, on either channel |
| N4 | Cleaning never re-renders or re-encodes. Output fidelity is preserved |
| N5 | Every cleaned output is verified by a detector other than the one that stripped it |
| N6 | No third-party script, pixel, iframe, or request from any flow handling a file |
| N7 | No account, identifier, or persistent pseudonym exists anywhere in the system |
| N8 | One user cannot degrade service for others |
| N9 | Under load, refuse new work with a clear message rather than accept work that cannot finish in time |
| N10 | Both channels traverse the same states and enforce the same gates |

## Security requirements

**The design assumes parser compromise will happen and caps what it costs.** Validation reduces how many files reach a parser; it never certifies one as safe.

### Admission — three-stage funnel, each stage rejecting before spending the resource it protects

1. Cloudflare edge, catching raw floods.
2. Pre-flight capacity check **before accepting any file bytes**.
3. Bounded backlog: reject once estimated wait would consume more than roughly a third of the job's TTL budget.

Caps: per-IP concurrency **3, counting all formats together**; per-IP rolling quota ~2GB per hour; global ceiling `healthy_replicas × per_replica_capacity`, computed live, never hardcoded; per-node disk breaker at 90% of the 60% reserved portion. Per-IP caps do not scale with fleet size.

### Sandbox — the control that makes compromise survivable

One file, one job, one sandbox, never reused. bubblewrap: mount, PID, network and user namespaces plus seccomp. Non-root, all capabilities dropped, `no-new-privileges`. **No network interface, resolver, or route. No inherited secrets.** Read-only bind mount of exactly one file; separate write-only output path; tmpfs only, no writable host path. CPU, memory, disk, process-count and wall-clock limits. Teardown on completion, failure, crash and timeout alike.

### Input validation

Magic-byte typing server-side. Macro rejection by inspecting zip contents for `vbaProject.bin` or a macro-enabled content type in `[Content_Types].xml` — **a renamed `.docm` must still be caught, before it reaches a worker**. Archive ceilings on expanded size, entry count, and single-XML size, checked at admission rather than discovered mid-parse. Normalised-path checks rejecting any entry escaping the extraction root. DTD processing and external entity resolution disabled.

### Tokens

256-bit CSPRNG, base64url. Issued once in the upload-complete response body. **Stored hashed only.** Header transport on every call. Scoped to one job, valid for its 15-minute TTL. No revocation endpoint — key expiry is the revocation mechanism. Redacted from every log, trace and error path.

`report_hash` is **not** an access control. It proves the client fetched the current report before requesting a clean, which is the technical enforcement of the reveal-before-clean promise. Computed server-side, compared byte for byte.

### Logging

**Logged:** upload attempts, type-validation failures, macro rejections, parser crashes and timeouts, quota denials, rate-limit hits, worker restarts, disk high-water, Redis auth failures, cleanup failures, orphan sweeps, token mismatches, abnormal download patterns, direct-origin probes.

**Never logged, in application logs, access logs, error traces or crash dumps alike:** filenames, metadata values, report contents, `review_token`, `report_hash`, download capabilities, Telegram user and chat identifiers.

### Secrets

No secret in an image layer, including build arguments that persist in history. None in version control. Runtime injection only. Required secrets declared **without defaults** so the stack fails closed. Redis ACL users separate `api`, `worker` and `ops` roles. Sandboxes inherit nothing.

Every value that appeared in the original committed `.env` is treated as compromised and rotated before launch, regardless of history rewriting.

### Networks

`edge` — frontend, api, bot; externally reachable. `core` — api, redis, workers; declared `internal: true`. `api` spans both; nothing else does. **Worker egress denial is topological, not rule-based** — there is nothing to misconfigure and nothing to drift.

## Telegram channel — where its constraints change the design

- Long polling, no public inbound endpoint. `edge` network only. No Redis credentials, no parser tooling.
- **Compressed photos are refused, not processed.** Telegram re-encodes them before the bot sees them; cleaning one would return a cleaned copy of Telegram's derivative while the user's real original stays unclean on their device, believing it was handled. Refusal names the mechanism per platform.
- Private chats only. A metadata report posted in a group makes the tool itself the leak.
- Per-chat fairness in-process with in-memory counters, never persisted. **Exactly one replica** — the only deliberately stateful component. Two would split the counters.
- The API treats the bot as one client with an elevated budget. **Telegram identity never crosses the API boundary.**
- `callback_data` caps at 64 bytes and cannot carry credentials — the button carries a short opaque handle resolved from memory.
- Report paginated within 4096 characters, privacy findings first. **Never attached as a file** — that would place the sensitive values into a file on Telegram's servers.
- Absolute expiry time stated, not a live countdown; Telegram rate-limits message edits.
- Bot deletes its own report messages at TTL, and discloses that the user's own copy remains.

## Code standards

**Backend:** Python 3.12, FastAPI + Celery. `ruff format`, `ruff` lint, **`mypy` strict across `api/` and `workers/`**. The pyright/basedpyright configuration in the original `pyproject.toml` is replaced by mypy, not kept alongside it.

**Frontend:** TypeScript 5.1+, Next.js 16. Prettier, ESLint, `strict: true`. No `any` without an inline justification comment.

**Testing policy — the gate is the mitigation-to-test mapping, not a coverage percentage.** Every mitigation in `security.md` needs a test that **fails when the mitigation is removed**. Parser code paths need fixture-based tests including malformed input. A change touching admission control, token handling, sandbox invocation, or TTL logic does not land without a test exercising it. The twenty V-checks in `security.md` are the minimum security set.

**Commits and PRs:** conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). One logical change per PR. Any PR touching a security control names the control in its description and links the relevant threat ID from `security.md`.

**Documentation:** every config value whose purpose is a security or privacy guarantee carries a comment saying so **in the file itself**, not only in the context docs — the Redis persistence settings and the `internal: true` network flag being the two named cases. Parser functions document which metadata namespaces they touch, because that list feeds the coverage manifest.

## Process rules and protected paths

| Rule | |
| --- | --- |
| No direct Redis access outside `jobs/store.py` | invariant 12 |
| No parser import inside the API service | invariant 4 |
| No secret read from anywhere other than `config.py` | invariant 12 |
| Sandbox invocation goes through the one wrapper, never called per-worker | invariant 12 |
| `frontend/lib/api/` is generated from the contract — **do not hand-edit** | architecture.md project tree |
| `.env.example` carries variable **names only**, never values | architecture.md configuration |
| `legacy/` is reference only — never imported, linted, type-checked, or tested, and git-ignored so it never enters history. Removed at P11 | phases.md P0 |
| `context/architecture.md` stays pure design — no progress notes, no process rules | architecture.md header |

## Build sequence

Order from `context/phases.md`. **A phase cannot start until the prior one is marked verified in `context/progress-tracker.md`.** Every phase gets an approved plan file in `context/prompts/` before any implementation.

| | Phase |
| --- | --- |
| P0 | Foundation, repo hygiene, local runtime, bubblewrap host gate |
| P1 | Job store, state machine, capability tokens |
| P2 | Detection and admission |
| P3 | Job API and published contract |
| P4 | Core engine — sandbox, report schema, three workers, Celery config |
| P5 | Telegram bot |
| P6 | Lifecycle automation, logging, observability |
| P7 | Design system — **deferred**, pending frontend structure in `architecture.md` |
| P8 | Core UI screens, placeholder data |
| P9 | Read path, web client against the real API |
| P10 | Trust artifacts — coverage manifest, limits page, weight-bearing copy |
| P11 | Deploy, harden, launch gates |

Skipped from the standard order, with reasons recorded in `phases.md`: **auth** (no accounts exist), **seed data** (none exists), **intelligence** (no AI component).

## Frontend conventions — deferred, not missing

ScrubEX is a backend-heavy project and the backend chain is built first. `architecture.md` currently covers the frontend in a single stack row, and will be extended with frontend structure before P7 is planned.

Until then this file carries **no UI conventions section**, and P7–P9 are not planned. When those phases come up, derive their conventions from the extended `architecture.md` — not from an invented substitute, and not inline while building.

The existing frontend shell (Next.js 16, React 19, Tailwind 4, Radix, framer-motion, lucide) is sound and is not being rebuilt. P7–P9 codify and wire it.
