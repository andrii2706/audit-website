#!/usr/bin/env bash
# Run the built site in standalone mode (thin wrapper; works the same as `npm start` in web/).
# Usage: (cd web && npm run build) && ./run-web.sh
set -e
cd "$(dirname "$0")/web"
exec node scripts/start-standalone.mjs
