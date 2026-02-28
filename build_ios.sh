#!/bin/bash
cd mobile/ios
xcodebuild -workspace BestVersionOfYourself.xcworkspace -scheme BestVersionOfYourself -configuration Debug -sdk iphonesimulator -destination "id=13E269BF-60FB-4B1F-B9FE-7A1CDA4318F7" build > build_output.log 2>&1
echo "BUILD EXITED WITH CODE $?" > build_status.txt
