"""The sole secret-reading point in the system (invariant 12).

No other module reads ``os.environ`` or a dotenv file. ``tests/security/
test_module_boundaries.py`` enforces that by AST scan, so the boundary fails a
test rather than drifting.

Settings are split by role rather than exposed as one ``Settings`` object,
because ``context/security.md`` makes privilege separation structural:

    Component | Holds Redis credentials | Contains a parser
    api       | yes                     | no
    bot       | no                      | no
    workers   | yes                     | no (parsers run in the sandbox)
    sandbox   | no                      | yes

A single settings class with a required ``REDIS_PASSWORD`` would force a Redis
credential onto the bot, collapsing that separation for convenience. Instead
``BotSettings`` has no Redis field at all -- it cannot express one. The process
that holds credentials cannot parse a hostile file, and the process that parses
a hostile file holds no credentials.

Required secrets are declared without defaults, so the stack fails closed:
instantiation raises rather than falling back to something insecure (T15).
"""

from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# The dotenv file is a local-development convenience only. In production every
# value arrives by runtime injection -- no secret is ever baked into an image
# layer, and none is committed (T15).
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILE = _PROJECT_ROOT / ".env"


class _Base(BaseSettings):
    """Shared loader configuration.

    ``extra="ignore"`` is required, not incidental: all three role classes read
    the same environment, so each must tolerate variables belonging to another
    role. It is also what lets ``BotSettings`` sit in an environment where
    ``REDIS_PASSWORD`` is present and still have no field to bind it to.
    """

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


class _ScratchMixin(BaseSettings):
    """Bounded scratch disk, shared by the api and worker roles."""

    # Bounded, encrypted at rest, swept for orphans on startup. Holds file bytes
    # only -- never job state, which lives in Redis so that per-key TTL makes
    # expiry a database guarantee.
    SCRATCH_DIR: Path

    # blueprint N1: files and reports expire 15 minutes after upload completes,
    # and downloading does not extend it. This is a published guarantee and the
    # basis of the backlog-depth admission rule -- changing it changes both.
    JOB_TTL_SECONDS: int = Field(default=900, gt=0)


class ApiSettings(_Base, _ScratchMixin):
    """Core job API. The only service on both the edge and core networks."""

    # Composed from REDIS_PASSWORD at deploy time. Redis holds every job record,
    # both per-format queues and all admission counters.
    REDIS_URL: str

    # No default: the stack refuses to start rather than reaching Redis
    # unauthenticated (T15). Redis compromise would expose live reports, so this
    # credential never leaves the core network.
    REDIS_PASSWORD: SecretStr

    # Origin the web client calls. Declared with ":?" in compose for the same
    # fail-closed reason.
    PUBLIC_API_URL: str


class WorkerSettings(_Base, _ScratchMixin):
    """Format workers. Core network only -- no route to the internet at all.

    Egress denial is topological rather than rule-based, so there is nothing to
    misconfigure and nothing to drift.
    """

    REDIS_URL: str
    REDIS_PASSWORD: SecretStr

    # Only bubblewrap is implemented. Kata and Firecracker were rejected for
    # requiring nested virtualisation; sibling containers for requiring a
    # docker.sock mount, which is root-equivalent on the host.
    SANDBOX_BACKEND: Literal["bubblewrap"] = "bubblewrap"


class BotSettings(_Base):
    """Telegram bot. Edge network only.

    Deliberately holds **no** Redis credentials and no scratch path: a thin
    client exactly like the web frontend. Adding a Redis field here would
    violate the privilege separation table above, and
    ``tests/security/test_config_fails_closed.py`` asserts it stays absent.
    """

    # No default: the bot cannot start unauthenticated (T15). Full control of the
    # bot identity and its message history, so treated as a top-tier secret.
    TELEGRAM_BOT_TOKEN: SecretStr

    # The bot reaches the API by service name and is treated as a single client
    # with an elevated concurrency budget, so Telegram identity never crosses
    # the API boundary.
    PUBLIC_API_URL: str


__all__ = ["ApiSettings", "BotSettings", "WorkerSettings"]
