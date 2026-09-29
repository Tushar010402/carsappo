#!/bin/sh
# Vercel build: apply database migrations, seed when SEED_ON_BUILD=true (staging / client previews), then build.
# The seed is idempotent, so re-running it on every deploy is safe.
set -e
npx prisma generate
npx prisma migrate deploy
if [ "$SEED_ON_BUILD" = "true" ]; then npx tsx prisma/seed.ts; fi
npx next build
