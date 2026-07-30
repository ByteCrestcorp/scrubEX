# infra

Topology, networks and hardening flags. This directory owns **how services are
wired and confined**, never application behaviour.

| File | Owns |
| --- | --- |
| `compose.yml` | Service topology, the two-network split, per-service hardening |
| `redis/redis.conf` | Redis settings that are security controls, not tuning |
| `docker/backend.Dockerfile` | Five targets: `api`, `bot`, `worker-image`, `worker-pdf`, `worker-office` |
| `docker/frontend.Dockerfile` | Next.js standalone build |

## Host verification gate — run this before choosing a provider

The per-job sandbox is the control that makes a parser compromise survivable, and
it is built on `bubblewrap`, which requires **unprivileged user namespaces**.
Under `cap_drop: ALL` that needs either unprivileged userns enabled on the host
kernel, or a seccomp profile permitting `clone`/`unshare` with `CLONE_NEWUSER`.

**This is a hosting requirement, exactly as nested virtualisation would have
been** under the rejected Kata/Firecracker path. A host that fails this test is
disqualified — do not work around it, and do not relax `cap_drop`.

The test has to mirror production in two ways that are easy to get wrong:
bubblewrap is **baked into the image at build time** (as root), and capabilities
are dropped **at runtime**. Installing packages inside an already-`cap_drop: ALL`
container fails for unrelated reasons — apt needs `CAP_CHOWN` and `CAP_SETUID` —
and would report a false negative on a perfectly good host.

```bash
# 1. Bake bubblewrap in, exactly as the worker images do.
docker build -t scrubex-hostgate - <<'DOCKERFILE'
FROM debian:12-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends bubblewrap \
 && rm -rf /var/lib/apt/lists/*
DOCKERFILE

# 2. Run it with every capability dropped, exactly as compose does.
docker run --rm --cap-drop ALL --security-opt no-new-privileges scrubex-hostgate \
  sh -c 'bwrap --unshare-all --ro-bind /usr /usr --ro-bind /lib /lib \
               --tmpfs /tmp --dev /dev --die-with-parent /usr/bin/true \
         && echo NAMESPACE_OK'
```

Use `/usr/bin/true`, not `/bin/true`. Under `--unshare-all` the sandbox root is a
fresh tmpfs carrying only the explicit binds, so the host's `/bin → usr/bin`
symlink does not exist inside it and `/bin/true` fails to exec.

`NAMESPACE_OK` means the sandbox mechanism holds on this host. Anything else is a
finding that changes the hosting shortlist.

Once the worker images are built, the same check runs against the real thing:

```bash
docker compose --env-file .env -f infra/compose.yml run --rm --no-deps worker-pdf \
  sh -c 'bwrap --unshare-all --ro-bind /usr /usr --ro-bind /lib /lib \
               --tmpfs /tmp --dev /dev --die-with-parent /usr/bin/true \
         && echo NAMESPACE_OK'
```

If a candidate host fails, the documented fallback is **gVisor**, retained as a
benchmarked upgrade rather than a v1 assumption — it needs no nested
virtualisation, but intercepts syscalls in userspace, which penalises I/O-heavy
work most.

## Running locally

```bash
cp ../.env.example ../.env    # then fill in values

# From the project root:
docker compose --env-file .env -f infra/compose.yml config   # validate topology
docker compose --env-file .env -f infra/compose.yml up --build
```

`--env-file` is required, not optional. Docker Compose resolves `.env` relative to
the **compose file's** directory, so without the flag it looks in `infra/` and
finds nothing — and because every required variable is declared `:?`, the stack
then refuses to start. That failure is the fail-closed declaration working
correctly; it is not a broken compose file.

`REDIS_PASSWORD` and `PUBLIC_API_URL` are declared with `:?`, so the stack
**refuses to start** rather than falling back to an insecure default. That is
intentional — if `docker compose up` fails complaining about a missing variable,
the fail-closed declaration is working.

**Local differs from production in one way that matters:** there is no Cloudflare
in front of the origin, so *origin pinning is absent locally and must not be
assumed during testing*. Authenticated Origin Pulls and the origin firewall are
account-side configuration, not compose configuration.

## The two-network split

```text
edge    frontend, api, bot          externally reachable
core    api, redis, workers         internal: true — no route to the internet
```

`api` is the only service on both. Nothing else spans them.

Worker egress denial is **topological, not firewall-based**: a worker cannot
reach out because no path exists, not because a rule forbids one. There are no
rules to drift out of sync with intent.

Verify it is real rather than declared:

```bash
docker compose -f compose.yml run --rm worker-pdf \
  python -c "import socket; socket.create_connection(('1.1.1.1', 53), timeout=3)"
# expected: failure
```

> Adding external routing to `core` to debug a connectivity problem silently
> removes egress denial, with no error and no visible symptom. Treat that change
> as a security incident, not a troubleshooting step (invariant 3).

## Hardening applied to every service

`read_only: true` · `cap_drop: [ALL]` · `no-new-privileges` · non-root
(10001 backend / 10002 frontend) · tmpfs for every writable path · bounded
json-file logging.

Redis `/data` is tmpfs, so there is deliberately nowhere for it to persist even
if a future edit re-enabled snapshotting.

## Deliberately absent

| Absent | Why |
| --- | --- |
| `docker.sock` mount | Root-equivalent on the host. The sandbox is an in-process bubblewrap namespace, so nothing needs container-spawning rights |
| Redis persistence volume | Would retain expired job data, falsifying the privacy claim. See `redis/redis.conf` |
| MongoDB | Job state consolidated into Redis, whose per-key TTL makes expiry a database guarantee |
| TUS / chunked upload | Deferred with video. Image, PDF and DOCX sit well under Cloudflare's proxy body cap, so upload is a single POST |
| `worker-video` | Deferred at v1; the design stays valid. Adding it later is a container and a queue name |

## Out of scope for compose, still required before launch

Cloudflare configuration is account-side: **Full (strict)**, **Authenticated
Origin Pulls**, and an **origin firewall allowlisting Cloudflare ranges only**.

The origin must reject any traffic that did not arrive through Cloudflare.
Without that, every edge control in this architecture — WAF, rate limits, body
caps — is advisory only, bypassed by anyone who discovers the origin IP.

Cloudflare rate rules must also treat **status reads separately from job
creation**. A client polling a job for its full TTL is hundreds of requests from
one address and is indistinguishable from abuse unless configured deliberately.
That is still an open item, and gate V9 depends on it.
