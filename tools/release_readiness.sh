#!/usr/bin/env bash
set -euo pipefail

RUN_E2E=0
if [[ "${1:-}" == "--with-e2e" ]]; then
  RUN_E2E=1
fi

echo "[release-readiness] typecheck"
npm run typecheck

echo "[release-readiness] targeted ops coverage"
npm run test:run -- tests/settingsDiagnostics.test.tsx tests/uiActions.test.tsx tests/batch9/reportsCompletionPanel.test.tsx tests/integration/restoreRoundtripFlow.test.ts

echo "[release-readiness] full unit/integration coverage"
npm run test:coverage

echo "[release-readiness] frontend production build"
npm run build

echo "[release-readiness] java server compilation"
javac java_server/src/com/tahir/server/Main.java
find java_server/src/com/tahir/server -maxdepth 1 -name '*.class' -delete

if [[ "$RUN_E2E" == "1" ]]; then
  echo "[release-readiness] e2e suite"
  npm run test:e2e
fi

echo "[release-readiness] complete"
