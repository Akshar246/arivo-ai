# ─────────────────────────────────────────────────────────────
# FRONTEND DOCKERFILE — Multi-stage build
# This is the most advanced pattern — pay attention here.
#
# TEACHING POINT — Multi-stage builds:
# Stage 1 (builder): install deps + build React → produces /dist
# Stage 2 (production): take ONLY /dist, serve with nginx
#
# Why? The build stage needs node_modules (200MB+), Vite,
# all dev tools. The final image needs NONE of that —
# just the compiled HTML/CSS/JS files served by nginx (tiny).
#
# Result: build image = 800MB. Final image = 25MB.
# This is standard practice at every serious company.
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build ───────────────────────────────────────────
# We name this stage "builder" so Stage 2 can reference it.
FROM node:18-alpine AS builder

WORKDIR /app

# Copy and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────────
# Pass build-time environment variables.
# TEACHING POINT — Build args vs runtime env vars:
# Vite bakes env vars into the JS bundle at BUILD time.
# They are not read at runtime like Node.js env vars.
# So we pass them as ARG (build arguments) and set them
# as ENV so Vite can read them during `npm run build`.
#
# On AWS, you'll pass these as --build-arg in the docker build
# command, pointing at your real backend URLs.
# ─────────────────────────────────────────────────────────────
ARG VITE_AI_URL=http://localhost:8000
ARG VITE_API_URL=http://localhost:5001
ENV VITE_AI_URL=$VITE_AI_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy source and build
COPY . .
RUN npm run build
# /app/dist now contains your compiled React app

# ── Stage 2: Production (nginx) ───────────────────────────────
# Fresh start — none of Stage 1's node_modules come with us.
# Only the compiled /dist folder gets copied across.
FROM nginx:alpine

# ─────────────────────────────────────────────────────────────
# Copy the compiled React app from Stage 1 into nginx's
# web root. nginx will serve these static files directly.
# ─────────────────────────────────────────────────────────────
COPY --from=builder /app/dist /usr/share/nginx/html

# ─────────────────────────────────────────────────────────────
# nginx config for React Router.
# Without this, refreshing on /jobs gives a 404 because nginx
# looks for an actual /jobs file (which doesn't exist).
# This config tells nginx: always serve index.html, and let
# React Router handle the URL.
# ─────────────────────────────────────────────────────────────
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx starts automatically — no CMD needed
# (the base nginx:alpine image already has one)
