"""Redis settings that are security controls stay set (invariant 2, T20).

Three settings in ``infra/redis/redis.conf`` are the difference between the
privacy claim being true and being approximately true. Two of the three changes
an operator would reach for first while troubleshooting will either falsify a
published claim or silently destroy live user work.

T20 is specifically about silent misconfiguration, so this file asserts the
**explanatory comments** as well as the values. A setting whose comment has been
stripped is one edit away from being changed by someone who never learns why it
was set.
"""

from pathlib import Path

import pytest

_CONF = Path(__file__).resolve().parents[3] / "infra" / "redis" / "redis.conf"


@pytest.fixture(scope="module")
def conf_lines() -> list[str]:
    assert _CONF.is_file(), f"missing {_CONF}"
    return _CONF.read_text(encoding="utf-8").splitlines()


def _directive_line(lines: list[str], directive: str) -> int:
    for index, line in enumerate(lines):
        if line.strip().startswith(directive):
            return index
    pytest.fail(
        f"redis.conf no longer sets `{directive}`. This is a security control, "
        "not tuning — see the file header before changing it."
    )


def _preceding_comment(lines: list[str], index: int, window: int = 12) -> str:
    start = max(0, index - window)
    return "\n".join(line for line in lines[start:index] if line.strip().startswith("#"))


def test_rdb_snapshots_stay_disabled(conf_lines: list[str]) -> None:
    """A snapshot writes job records to disk, where they survive their TTL."""
    index = _directive_line(conf_lines, "save ")

    assert conf_lines[index].strip() == 'save ""', (
        "RDB snapshotting is enabled. Expired files and metadata reports would "
        "exist in a .rdb file after the product told the user they were gone, "
        "making the core privacy claim technically false."
    )


def test_append_only_file_stays_disabled(conf_lines: list[str]) -> None:
    """An AOF log retains the write history of every expired job."""
    index = _directive_line(conf_lines, "appendonly")

    assert conf_lines[index].split()[1] == "no", (
        "appendonly is enabled. TTL'd job data would survive in the AOF log, "
        "which is the same retention failure as RDB by a different route "
        "(invariants 2 and 14)."
    )


def test_eviction_policy_stays_noeviction(conf_lines: list[str]) -> None:
    """Any allkeys-* policy silently destroys in-flight jobs."""
    index = _directive_line(conf_lines, "maxmemory-policy")

    assert conf_lines[index].split()[1] == "noeviction", (
        "maxmemory-policy is not noeviction. Redis will evict live job records "
        "early under memory pressure, destroying in-flight work with no error to "
        "the user or the operator. Failing loudly at admission is correct; "
        "losing a job quietly is not."
    )


@pytest.mark.parametrize(
    ("directive", "keyword"),
    [
        ("save ", "snapshot"),
        ("appendonly", "AOF"),
        ("maxmemory-policy", "evict"),
    ],
)
def test_each_control_carries_its_rationale(
    conf_lines: list[str], directive: str, keyword: str
) -> None:
    """T20: the security purpose is commented in the config file itself.

    blueprint.md documentation expectations name the Redis persistence settings
    as one of two cases where this is mandatory, precisely because these are the
    settings an operator changes at 2am while troubleshooting.
    """
    index = _directive_line(conf_lines, directive)
    comment = _preceding_comment(conf_lines, index)

    assert comment, f"`{directive}` has no explanatory comment above it (T20)."
    assert keyword.lower() in comment.lower(), (
        f"the comment above `{directive}` no longer explains the consequence "
        f"(expected a mention of {keyword!r}). A stripped rationale is one edit "
        "away from a silent misconfiguration."
    )


@pytest.mark.parametrize("command", ["CONFIG", "FLUSHALL", "FLUSHDB", "KEYS", "DEBUG"])
def test_dangerous_commands_are_renamed_out(conf_lines: list[str], command: str) -> None:
    """CONFIG would let a client re-enable persistence, bypassing every control."""
    expected = f'rename-command {command} ""'

    assert any(line.strip() == expected for line in conf_lines), (
        f"{command} is back on the command surface. CONFIG in particular can "
        "re-enable persistence at runtime; FLUSHALL/FLUSHDB destroy every live "
        "job; KEYS enumerates them."
    )
