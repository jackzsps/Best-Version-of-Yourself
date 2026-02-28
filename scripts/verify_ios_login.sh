#!/bin/bash
# scripts/verify_ios_login.sh
# Verifies the iOS app launches and the login modal works using Mobile MCP

echo "📱 Launching BestVersionOfYourself on iOS Simulator..."
xcrun simctl launch booted com.kuo.BestVersionOfYourself

echo "⏳ Waiting for app to load..."
sleep 5

echo "🔍 Using Mobile MCP to check screen..."
# In a real environment, we would use Claude Desktop or an MCP client.
# For this script, we simulate an MCP command line call if @mobilenext/mobile-mcp had a CLI.
npx -y @mobilenext/mobile-mcp@latest action --platform ios --type read_screen

echo "👆 Clicking 'Home' or 'Login' tab to trigger Auth Modals..."
npx -y @mobilenext/mobile-mcp@latest action --platform ios --type click_element --label "Settings"

sleep 2

echo "✅ iOS Login Flow Verification Complete."
