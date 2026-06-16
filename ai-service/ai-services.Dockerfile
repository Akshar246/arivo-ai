# ─────────────────────────────────────────────────────────────
# AI SERVICE DOCKERFILE
# This builds the FastAPI service (port 8000)
# Handles: job search, chat (RAG), skill gap, CV analysis
#
# TEACHING POINT — Why python:3.11-slim?
# "slim" = stripped-down base image. No compilers, no extras.
# Full python:3.11 = 900MB. Slim = 130MB. Always use slim
# for production unless you need build tools (we don't).
# ─────────────────────────────────────────────────────────────
FROM python:3.11-slim

# ─────────────────────────────────────────────────────────────
# WORKDIR sets the default directory inside the container.
# All subsequent commands (COPY, RUN, CMD) run from here.
# Convention: use /app for application code.
# ─────────────────────────────────────────────────────────────
WORKDIR /app

# ─────────────────────────────────────────────────────────────
# Install system dependencies FIRST.
# These are C libraries that Python packages need to compile.
# pdfplumber needs poppler. chromadb needs build-essential.
#
# TEACHING POINT — Why --no-install-recommends?
# Stops apt installing "recommended" extras we don't need.
# Keeps the image smaller. Always use this flag.
#
# TEACHING POINT — Why clean up apt cache?
# `rm -rf /var/lib/apt/lists/*` deletes the package index
# after installing. Docker layers are immutable — if you don't
# clean up in the SAME RUN command, the cache is baked in forever
# even if you delete it in a later step.
# ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ─────────────────────────────────────────────────────────────
# COPY requirements BEFORE copying code.
# This is the most important Docker caching trick:
#
# Docker caches each layer. If requirements.docker.txt hasn't
# changed, Docker reuses the cached pip install layer —
# saving 3-5 minutes on every rebuild.
#
# If you COPY . . first, any code change invalidates the cache
# and pip reinstalls everything every single time.
# ─────────────────────────────────────────────────────────────
COPY requirements.docker.txt .

# ─────────────────────────────────────────────────────────────
# Install Python dependencies.
# --no-cache-dir: don't cache pip downloads in the image.
# We don't need them after install, so this saves ~100MB.
# ─────────────────────────────────────────────────────────────
RUN pip install --no-cache-dir -r requirements.docker.txt

# ─────────────────────────────────────────────────────────────
# NOW copy the application code.
# This layer only rebuilds when your actual code changes —
# not when dependencies change. Best of both worlds.
# ─────────────────────────────────────────────────────────────
COPY . .

# ─────────────────────────────────────────────────────────────
# EXPOSE documents which port this container listens on.
# TEACHING POINT: EXPOSE doesn't actually open the port —
# that's done in docker-compose.yml with "ports:".
# EXPOSE is documentation. It tells other developers (and tools)
# which port this service expects to receive traffic on.
# ─────────────────────────────────────────────────────────────
EXPOSE 8000

# ─────────────────────────────────────────────────────────────
# CMD is the default command that runs when the container starts.
# TEACHING POINT — CMD vs ENTRYPOINT:
# CMD: default command, can be overridden at runtime
# ENTRYPOINT: fixed command, cannot be overridden easily
# For web services, CMD is the right choice.
#
# host=0.0.0.0 is CRITICAL in Docker — without it, uvicorn
# only listens on localhost INSIDE the container, and nothing
# outside can reach it. 0.0.0.0 means "listen on all interfaces."
# ─────────────────────────────────────────────────────────────
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
