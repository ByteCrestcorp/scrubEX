"""Required secrets have no defaults, so the stack fails closed (T15).

Also asserts the structural half of the privilege separation table in
``security.md``: the bot cannot express a Redis credential, because
``BotSettings`` has no field to bind one to. That is enforced here rather than
left to reviewer discipline -- collapsing the separation "just for convenience"
should turn a test red.

Every case runs against a subclass with ``env_file=None``. Without that
isolation these tests would read the project's real ``.env``, find values there,
and pass for the wrong reason. The subclasses change *where* settings are read
from and nothing else: field definitions, and therefore which fields are
required, are inherited unchanged.
"""

import pytest
from pydantic import ValidationError
from pydantic_settings import SettingsConfigDict

from scrubex.config import ApiSettings, BotSettings, WorkerSettings

_NO_DOTENV = SettingsConfigDict(env_file=None, extra="ignore", case_sensitive=True)

# Every instantiation below carries `# type: ignore[call-arg]`. mypy synthesises
# an __init__ from the model fields and so demands each required field as a named
# argument -- but settings are sourced from the environment, and omitting them is
# precisely what these tests assert. The ignores are narrow and `warn_unused_
# ignores` is on, so they cannot go stale silently.

_REDIS_VARS = ("REDIS_URL", "REDIS_PASSWORD", "SCRATCH_DIR", "JOB_TTL_SECONDS")
_BOT_VARS = ("TELEGRAM_BOT_TOKEN", "PUBLIC_API_URL")


class IsolatedApiSettings(ApiSettings):
    model_config = _NO_DOTENV


class IsolatedWorkerSettings(WorkerSettings):
    model_config = _NO_DOTENV


class IsolatedBotSettings(BotSettings):
    model_config = _NO_DOTENV


def test_api_settings_refuses_to_load_without_redis_password(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for var in (*_REDIS_VARS, "PUBLIC_API_URL"):
        monkeypatch.delenv(var, raising=False)

    with pytest.raises(ValidationError) as exc:
        IsolatedApiSettings()  # type: ignore[call-arg]

    assert "REDIS_PASSWORD" in str(exc.value)


def test_worker_settings_refuses_to_load_without_redis_password(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for var in _REDIS_VARS:
        monkeypatch.delenv(var, raising=False)

    with pytest.raises(ValidationError) as exc:
        IsolatedWorkerSettings()  # type: ignore[call-arg]

    assert "REDIS_PASSWORD" in str(exc.value)


def test_bot_settings_refuses_to_load_without_bot_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for var in _BOT_VARS:
        monkeypatch.delenv(var, raising=False)

    with pytest.raises(ValidationError) as exc:
        IsolatedBotSettings()  # type: ignore[call-arg]

    assert "TELEGRAM_BOT_TOKEN" in str(exc.value)


def test_bot_settings_cannot_hold_a_redis_credential() -> None:
    """security.md privilege separation: the bot holds no Redis credentials.

    Structural, not conventional -- there is no field to populate.
    """
    fields = set(BotSettings.model_fields)

    assert not {f for f in fields if "REDIS" in f.upper()}, (
        f"BotSettings gained a Redis field: {sorted(fields)}. The bot is a thin "
        "client and must hold no Redis credentials (security.md privilege "
        "separation)."
    )


def test_bot_settings_has_no_scratch_access() -> None:
    """The bot pipes file bytes but never touches the scratch disk."""
    assert "SCRATCH_DIR" not in set(BotSettings.model_fields), (
        "BotSettings gained SCRATCH_DIR. Scratch is reachable by the api (for "
        "download) and the workers' sandboxes only."
    )


def test_bot_ignores_a_redis_password_present_in_the_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The bot shares a host with services that do hold credentials.

    Even with REDIS_PASSWORD exported, the bot must not absorb it.
    """
    monkeypatch.setenv("REDIS_PASSWORD", "should-never-be-read-by-the-bot")
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "test-token")
    monkeypatch.setenv("PUBLIC_API_URL", "http://api:8000")

    settings = IsolatedBotSettings()  # type: ignore[call-arg]

    assert not hasattr(settings, "REDIS_PASSWORD")
    assert "should-never-be-read-by-the-bot" not in settings.model_dump_json()


def test_secrets_are_not_exposed_by_repr(monkeypatch: pytest.MonkeyPatch) -> None:
    """Secrets must not leak through a log line, traceback, or crash dump.

    ``SecretStr`` renders as ``**********``. security.md forbids credentials and
    review tokens from every log, trace and error path -- a parser crash log
    carrying a secret would defeat that.
    """
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "sensitive-bot-token-value")
    monkeypatch.setenv("PUBLIC_API_URL", "http://api:8000")

    settings = IsolatedBotSettings()  # type: ignore[call-arg]

    assert "sensitive-bot-token-value" not in repr(settings)
    assert "sensitive-bot-token-value" not in str(settings)
    assert "sensitive-bot-token-value" not in settings.model_dump_json()
    assert settings.TELEGRAM_BOT_TOKEN.get_secret_value() == "sensitive-bot-token-value"


def test_required_secrets_have_no_defaults() -> None:
    """The declaration itself must be default-free, not merely unset today.

    A default would make the stack start insecurely rather than refuse (T15).
    """
    assert ApiSettings.model_fields["REDIS_PASSWORD"].is_required()
    assert WorkerSettings.model_fields["REDIS_PASSWORD"].is_required()
    assert BotSettings.model_fields["TELEGRAM_BOT_TOKEN"].is_required()
