FROM python:3.11-slim

# Install system dependencies required by some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry (pinned to match the version that generated poetry.lock)
ENV POETRY_VERSION=1.8.2
RUN curl -sSL https://install.python-poetry.org | python3 - \
    && ln -s /root/.local/bin/poetry /usr/local/bin/poetry

WORKDIR /app

# Copy dependency manifests first for optimal layer caching.
# poetry.toml sets virtualenvs.in-project = true, so the venv lands in /app/.venv
COPY pyproject.toml poetry.toml poetry.lock ./

# Install only production dependencies into the in-project virtualenv
RUN poetry install --only main --no-interaction --no-ansi

# Copy the rest of the application source
COPY . .

# Run the worker using the in-project virtualenv directly, matching railway.toml
CMD [".venv/bin/python", "uvian_automation_worker/main.py"]
