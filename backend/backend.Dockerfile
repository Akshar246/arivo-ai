# ─────────────────────────────────────────────────────────────
# BACKEND DOCKERFILE
# This builds the Node/Express service (port 5001)
# Handles: auth (JWT), CV upload endpoint, user data
#
# TEACHING POINT — Why node:18-alpine?
# Alpine Linux is a tiny 5MB Linux distro used as a base.
# node:18 (full) = 1GB. node:18-alpine = 180MB.
# Alpine is the standard for Node.js Docker images in industry.
# ─────────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# ─────────────────────────────────────────────────────────────
# Copy package files FIRST (same caching trick as Python).
# package.json + package-lock.json → npm install → then code.
# ─────────────────────────────────────────────────────────────
COPY package.json package-lock.json ./

# ─────────────────────────────────────────────────────────────
# Install dependencies.
# --omit=dev: skip devDependencies. We don't need nodemon,
# eslint, jest etc in production. Keeps image lean and secure.
# ─────────────────────────────────────────────────────────────
RUN npm ci --omit=dev

# ─────────────────────────────────────────────────────────────
# Copy application code after dependencies are installed.
# ─────────────────────────────────────────────────────────────
COPY . .

# ─────────────────────────────────────────────────────────────
# Create the uploads directory.
# Your CV upload endpoint saves files here. Without this
# directory existing, the upload will crash with ENOENT.
# We create it here so it always exists in the container.
# ─────────────────────────────────────────────────────────────
RUN mkdir -p uploads

EXPOSE 5001

# ─────────────────────────────────────────────────────────────
# Start the Node server.
# TEACHING POINT — We use "node server.js" not "nodemon"
# nodemon is a dev tool (auto-restarts on changes).
# In production/Docker, you don't want auto-restart —
# you want predictable, stable process management.
# ─────────────────────────────────────────────────────────────
CMD ["node", "server.js"]
