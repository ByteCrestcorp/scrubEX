
FROM python:3.12-slim AS poetry-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PIP_NO_CACHE_DIR=1

WORKDIR /app


RUN pip install --no-cache-dir "poetry>=2.3,<3.0"

COPY backend/pyproject.toml backend/poetry.lock ./


FROM poetry-base AS deps-api
RUN poetry install --only main,api --no-root --no-interaction

FROM poetry-base AS deps-bot
RUN poetry install --only main,bot --no-root --no-interaction

FROM poetry-base AS deps-worker-image
RUN poetry install --only main,worker,parser-image --no-root --no-interaction

FROM poetry-base AS deps-worker-pdf
RUN poetry install --only main,worker,parser-pdf --no-root --no-interaction

FROM poetry-base AS deps-worker-office
RUN poetry install --only main,worker,parser-office --no-root --no-interaction

# =============================================================================

FROM python:3.12-slim AS runtime-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app


RUN groupadd --gid 10001 scrubex \
 && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin scrubex

COPY --chown=10001:10001 backend/scrubex ./scrubex


FROM runtime-base AS api
COPY --from=deps-api /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps-api /usr/local/bin /usr/local/bin
USER 10001
EXPOSE 8000
CMD ["uvicorn", "scrubex.api.routes:app", "--host", "0.0.0.0", "--port", "8000"]


FROM runtime-base AS bot
COPY --from=deps-bot /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps-bot /usr/local/bin /usr/local/bin
USER 10001
CMD ["python", "-m", "scrubex.bot"]


FROM runtime-base AS worker-image
COPY --from=deps-worker-image /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps-worker-image /usr/local/bin /usr/local/bin
RUN apt-get update \
 && apt-get install -y --no-install-recommends bubblewrap libimage-exiftool-perl \
 && rm -rf /var/lib/apt/lists/*
USER 10001
CMD ["celery", "-A", "scrubex.workers.image", "worker", "-Q", "image", "--loglevel=info"]


FROM runtime-base AS worker-pdf
COPY --from=deps-worker-pdf /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps-worker-pdf /usr/local/bin /usr/local/bin
RUN apt-get update \
 && apt-get install -y --no-install-recommends bubblewrap \
 && rm -rf /var/lib/apt/lists/*
USER 10001
CMD ["celery", "-A", "scrubex.workers.pdf", "worker", "-Q", "pdf", "--loglevel=info"]


FROM runtime-base AS worker-office
COPY --from=deps-worker-office /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps-worker-office /usr/local/bin /usr/local/bin
RUN apt-get update \
 && apt-get install -y --no-install-recommends bubblewrap \
 && rm -rf /var/lib/apt/lists/*
USER 10001
CMD ["celery", "-A", "scrubex.workers.office", "worker", "-Q", "office", "--loglevel=info"]
