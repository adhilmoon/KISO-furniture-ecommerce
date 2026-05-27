# syntax=docker/dockerfile:1.6

# ── Stage 1: install production deps ────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 2: runtime image ──────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4004

# Copy installed modules + application source
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src    ./src
COPY views  ./views
COPY public ./public

# Build Tailwind CSS — output.css is gitignored and generated from input.css.
# tailwindcss is a production dependency, so it's present in the deps modules.
RUN npm run build:css

# Drop privileges
RUN addgroup -S kiso && adduser -S kiso -G kiso \
    && chown -R kiso:kiso /app
USER kiso

EXPOSE 4004

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["node", "src/app.js"]
