#!/bin/bash
# scripts/release_all.sh
# A unified deployment script to release both iOS and Android apps simultaneously.

set -e

echo "🚀 Starting Full Automation Release Process for Best Version of Yourself"

# Define Paths
IOS_DIR="mobile/ios"
ANDROID_DIR="mobile/android"

# Step 1: Pre-flight checks (lint, types, tests)
echo "🔍 Running code validation and tests..."
npm run validate --prefix mobile

# Step 2: Build & Release Android
echo "🤖 Releasing Android to Play Store (Internal Track)..."
cd $ANDROID_DIR
bundle exec fastlane beta
cd ../..

# Step 3: Build & Release iOS
echo "🍎 Releasing iOS to TestFlight..."
cd $IOS_DIR
bundle exec fastlane beta
cd ../..

echo "✅ Deployment finished for both platforms."
