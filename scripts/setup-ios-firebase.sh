#!/bin/bash
# scripts/setup-ios-firebase.sh
# Generates mobile/ios/BestVersionOfYourself/GoogleService-Info.plist from environment variable

set -e

# Change to the project root directory relative to this script
DIR="$( cd "$( dirname "$0" )" && pwd )"
cd "$DIR/.."

if [ -f ".env" ]; then
  echo "Loading environment variables from .env"
  export $(grep -v '^#' .env | xargs)
fi

PLIST_PATH="mobile/ios/BestVersionOfYourself/GoogleService-Info.plist"

if [ -f "$PLIST_PATH" ]; then
  echo "GoogleService-Info.plist already exists at $PLIST_PATH. Skipping generation."
  exit 0
fi

if [ -z "$GOOGLE_SERVICE_INFO_PLIST_BASE64" ]; then
  echo "Error: GOOGLE_SERVICE_INFO_PLIST_BASE64 environment variable is not set."
  echo "Please set this variable with the base64 encoded content of your GoogleService-Info.plist."
  echo "Example: export GOOGLE_SERVICE_INFO_PLIST_BASE64=\$(base64 -i path/to/GoogleService-Info.plist)"
  exit 1
fi

echo "Generating GoogleService-Info.plist from base64 environment variable..."

# Decode base64 string to file (works on macOS and Linux)
echo "$GOOGLE_SERVICE_INFO_PLIST_BASE64" | base64 --decode > "$PLIST_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Successfully created $PLIST_PATH"
else
  echo "❌ Failed to decode and create GoogleService-Info.plist"
  exit 1
fi
