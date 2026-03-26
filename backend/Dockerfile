# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r app && useradd -r -g app app

# Copy virtual environment from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application
COPY --chown=app:app . .

# Switch to non-root user
USER app

# Expose port from environment
EXPOSE ${PORT:-8000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run the application
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "${PORT:-8000}"]
