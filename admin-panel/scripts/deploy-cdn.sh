#!/usr/bin/env bash
# Deploy the admin SPA to S3 + Amplify (CDN).
# Usage: from admin-panel/: ./scripts/deploy-cdn.sh
set -euo pipefail

PROFILE="${AWS_PROFILE:-house-and-sky}"
REGION="${AWS_REGION:-ap-south-1}"
BUCKET="${ADMIN_S3_BUCKET:-houseandsky-admin-ui}"
APP_ID="${AMPLIFY_APP_ID:-d5vfdu58v5ej1}"
BRANCH="${AMPLIFY_BRANCH:-main}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"
npm run build

echo "Syncing hashed assets to s3://$BUCKET ..."
aws s3 sync dist/ "s3://$BUCKET/" --profile "$PROFILE" --region "$REGION" --delete \
  --cache-control "public,max-age=31536000,immutable" --exclude "index.html" --exclude "*.png"
aws s3 cp dist/index.html "s3://$BUCKET/index.html" --profile "$PROFILE" --region "$REGION" \
  --cache-control "public,max-age=60,must-revalidate" --content-type text/html
aws s3 sync dist/ "s3://$BUCKET/" --profile "$PROFILE" --region "$REGION" \
  --exclude "*" --include "*.png" --cache-control "public,max-age=86400"

echo "Publishing Amplify deployment..."
rm -f /tmp/hs-admin-dist.zip
(cd dist && zip -r /tmp/hs-admin-dist.zip .)
JOB=$(aws amplify create-deployment --profile "$PROFILE" --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH" --output json)
UPLOAD_URL=$(python3 -c "import json,sys; print(json.load(sys.stdin)['zipUploadUrl'])" <<<"$JOB")
JOB_ID=$(python3 -c "import json,sys; print(json.load(sys.stdin)['jobId'])" <<<"$JOB")
curl -sS --upload-file /tmp/hs-admin-dist.zip "$UPLOAD_URL" >/dev/null
aws amplify start-deployment --profile "$PROFILE" --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB_ID" >/dev/null

for i in $(seq 1 40); do
  STATUS=$(aws amplify get-job --profile "$PROFILE" --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB_ID" --query 'job.summary.status' --output text)
  echo "Amplify job: $STATUS"
  case "$STATUS" in
    SUCCEED) echo "Live at https://admin.houseandsky.com"; exit 0 ;;
    FAILED|CANCELLED) exit 1 ;;
  esac
  sleep 5
done
echo "Timed out waiting for Amplify job $JOB_ID" >&2
exit 1
