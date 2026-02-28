#!/bin/bash
# scripts/run_e2e_tests.sh
# E2E Test Runner mapping Playwright to Web and Mobile MCP to iOS/Android

set -e

echo "🚀 Starting Full Automation E2E Testing (Web + iOS + Android)"

# 1. Start Web Server in background
echo "🌐 Starting Web Server..."
npm run dev --prefix web &
WEB_PID=$!

# Wait for Vite to boot up
sleep 3

# 2. Boot iOS Simulator (if not booted)
echo "🍎 Booting iOS Simulator (iPhone 15 Pro)..."
xcrun simctl boot "iPhone 15 Pro" || true

# 3. Boot Android Emulator (requires AVD named "Pixel_8_API_34" or similar)
# echo "🤖 Booting Android Emulator..."
# emulator -avd Pixel_8_API_34 -no-audio -no-window &
# ANDROID_PID=$!

# 4. Install dependencies for Playwright
cd e2e_tests
if [ ! -d "node_modules" ]; then
  npm init -y
  npm install @playwright/test
  npx playwright install chromium
fi

# 5. Run the tests
echo "🧪 Running Tests via Playwright Test Runner..."
npx playwright test cross_platform_e2e.spec.js

# 6. Cleanup
echo "🧹 Cleaning up processes..."
kill $WEB_PID
# kill $ANDROID_PID

echo "✅ All E2E Tests Finished."
