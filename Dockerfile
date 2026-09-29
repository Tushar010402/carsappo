# Production image: docker compose -f docker-compose.prod.yml up -d --build
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
COPY . .
# Baked into the client bundle at build time.
ARG NEXT_PUBLIC_SITE_URL=https://carsappo.com
ARG NEXT_PUBLIC_S3_PUBLIC_HOST=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_S3_PUBLIC_HOST=$NEXT_PUBLIC_S3_PUBLIC_HOST
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/data/uploads
# The full dependency tree is kept so `prisma migrate deploy` and `npm run db:seed` work inside the container.
COPY --from=build --chown=node:node /app ./
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 3000
# Apply pending migrations, then start. Seed once with: docker compose exec app npm run db:seed
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT}"]
