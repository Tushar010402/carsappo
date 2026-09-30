#!/usr/bin/env bash
# Deploy a client-preview (staging) copy of Carsappo to your Vercel account, with demo data and search
# indexing off. The build runs on Vercel, which applies database migrations and loads the demo data.
#
#   VERCEL_TOKEN=… DATABASE_URL=postgres://… ./scripts/deploy-preview.sh
#
# VERCEL_TOKEN: vercel.com → Account Settings → Tokens (free Hobby account is fine).
# DATABASE_URL: any Postgres (Neon / Supabase / Prisma Postgres; Singapore region is closest to India).
#   If omitted, a temporary Prisma Postgres database is created — it is deleted after 24 hours unless
#   you claim it with the printed link, so use your own database for anything you want to keep.
#
# Generated secrets are kept in .vercel/preview.env (git-ignored) so re-deploys keep sessions and the
# admin password. Payment, shipping and email keys (RAZORPAY_*, SHIPROCKET_*, SMTP_*, MAIL_FROM) are
# passed through when set in your shell.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "VERCEL_TOKEN is required (vercel.com → Account Settings → Tokens)." >&2
  echo "Deployments without an account expire after an hour, too soon to share with anyone." >&2
  exit 1
fi

VERCEL="npx -y vercel@61"
STATE=.vercel/preview.env
mkdir -p .vercel
ENV_DATABASE_URL=${DATABASE_URL:-}
[ -f "$STATE" ] && . "$STATE"
DATABASE_URL=${ENV_DATABASE_URL:-${DATABASE_URL:-}}   # a DATABASE_URL you pass wins over the saved one

if [ -z "${DATABASE_URL:-}" ]; then
  echo "▸ No DATABASE_URL given: creating a temporary Postgres database (Singapore, 24 h unless claimed)…"
  DB_JSON=$(npx -y create-db@latest create --region ap-southeast-1 --json)
  DATABASE_URL=$(node -e 'console.log(JSON.parse(process.argv[1]).connectionString)' "$DB_JSON")
  DB_CLAIM_URL=$(node -e 'console.log(JSON.parse(process.argv[1]).claimUrl)' "$DB_JSON")
fi
AUTH_SECRET=${AUTH_SECRET:-$(openssl rand -base64 48 | tr -d '\n')}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@carsappo.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-Cs-$(openssl rand -base64 12 | tr -d '/+=\n')}

umask 077
cat > "$STATE" <<STATE_EOF
DATABASE_URL='$DATABASE_URL'
AUTH_SECRET='$AUTH_SECRET'
ADMIN_EMAIL='$ADMIN_EMAIL'
ADMIN_PASSWORD='$ADMIN_PASSWORD'
STATE_EOF

ARGS=(
  -b "DATABASE_URL=$DATABASE_URL" -e "DATABASE_URL=$DATABASE_URL"
  -e "AUTH_SECRET=$AUTH_SECRET"
  -b SITE_ENV=staging -e SITE_ENV=staging
  -b SEED_ON_BUILD=true -b SEED_DEMO=true
  -b "ADMIN_EMAIL=$ADMIN_EMAIL" -b "ADMIN_PASSWORD=$ADMIN_PASSWORD"
)
for name in RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET RAZORPAY_WEBHOOK_SECRET SHIPROCKET_EMAIL SHIPROCKET_PASSWORD SHIPROCKET_WEBHOOK_TOKEN \
  SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD MAIL_FROM ADMIN_NOTIFY_EMAIL; do
  if [ -n "${!name:-}" ]; then ARGS+=(-e "$name=${!name}"); fi
done

echo "▸ Deploying to Vercel (the build runs on Vercel, ~3–5 minutes)…"
$VERCEL project add carsappo-preview --token "$VERCEL_TOKEN" >/dev/null 2>&1 || true   # no-op if it exists
$VERCEL link --yes --project carsappo-preview --token "$VERCEL_TOKEN" >/dev/null
URL=$($VERCEL deploy --prod --yes --token "$VERCEL_TOKEN" "${ARGS[@]}")

echo
echo "✓ Preview:     $URL"
echo "  Admin:       $URL/admin   ($ADMIN_EMAIL / $ADMIN_PASSWORD — change it after first login)"
[ -n "${DB_CLAIM_URL:-}" ] && echo "  Keep the DB: $DB_CLAIM_URL"
echo "  Search engines are blocked on this preview (robots.txt + X-Robots-Tag)."
