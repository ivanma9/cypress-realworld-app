#!/usr/bin/env bash
# Start the CI server and run one UI browser. Used by Cypress Tests.
# CYPRESS_BROWSER is required. CYPRESS_CONFIG is optional.
# When CYPRESS_RECORD=true, pass Cloud flags. CYPRESS_GROUP is the group name.
set -euo pipefail

if [ -z "${CYPRESS_BROWSER:-}" ]; then
  echo "CYPRESS_BROWSER is required" >&2
  exit 1
fi

log="${RUNNER_TEMP:-/tmp}/start-ci.log"
setsid yarn start:ci >"$log" 2>&1 &
dev_pid=$!
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "----- yarn start:ci (tail) -----"
    tail -n 120 "$log" || true
  fi
  kill -TERM -- "-${dev_pid}" 2>/dev/null || true
  sleep 1
  kill -KILL -- "-${dev_pid}" 2>/dev/null || true
  exit "$status"
}
trap cleanup EXIT

args=(--browser "$CYPRESS_BROWSER" --spec 'cypress/tests/ui/*')
if [ -n "${CYPRESS_CONFIG:-}" ]; then
  args+=(--config "$CYPRESS_CONFIG")
fi
if [ "${CYPRESS_RECORD:-}" = "true" ]; then
  args+=(--record --parallel --group "$CYPRESS_GROUP" --ci-build-id "${GITHUB_RUN_ID}")
fi

yarn cypress:run -- "${args[@]}"
