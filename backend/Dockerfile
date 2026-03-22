FROM python:3.12-slim

WORKDIR /app

# Ensure Python output is sent straight to logs (no buffering)
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# System deps (minimal — no Chromium/Playwright)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 10000

CMD ["sh", "-c", "echo '==> Container starting on port ${PORT:-10000}' && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000} --timeout-keep-alive 65 --workers 1"]
