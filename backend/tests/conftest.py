"""Shared test configuration.

Note the deliberate absence of a fixture that supplies real secrets. Tests that
exercise fail-closed behaviour pass ``_env_file=None`` and clear the environment
themselves -- otherwise they would read the project's real ``.env``, find values
there, and pass for the wrong reason.
"""

from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def project_root() -> Path:
    """Repository root, for tests that read infra/ artifacts."""
    return PROJECT_ROOT
