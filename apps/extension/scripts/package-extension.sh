#!/bin/bash

set -e

echo "Building Chrome extension..."
bun run build

echo "Creating zip file..."
cd .output/chrome-mv3
zip -r ../../xad-extension-chrome.zip . -x "*.DS_Store"
cd ../..

echo "Extension packaged successfully: xad-extension-chrome.zip"
ls -lh xad-extension-chrome.zip