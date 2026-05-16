# Multi-stage Dockerfile for Django backend

# Stage 1: Build
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages to specific location
COPY requirements.txt .
RUN pip install --prefix=/opt/python --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /opt/python /opt/python

# Set Python path for installed packages
ENV PATH=/opt/python/bin:$PATH \
    PYTHONPATH=/opt/python/lib/python3.11/site-packages:$PYTHONPATH

# Copy application code
COPY . .

# Create non-root user for security and set proper permissions
RUN useradd -m -u 1000 appuser && \
    chmod -R 755 /opt/python && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "config.wsgi:application"]
