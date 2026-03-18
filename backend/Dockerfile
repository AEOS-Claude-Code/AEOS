FROM python:3.12-slim

WORKDIR /app

# Ensure Python output is sent straight to logs (no buffering)
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# System deps (including Playwright/Chromium dependencies)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc libpq-dev \
        # Playwright Chromium dependencies
        libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
        libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
        libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
        libcairo2 libasound2 libatspi2.0-0 libwayland-client0 && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium browser (minimal)
RUN playwright install chromium

COPY . .

EXPOSE 10000

CMD python -c "print('==> Container starting, PORT=' + __import__('os').environ.get('PORT','unset')); import sys; sys.stdout.flush()" && \
    uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
