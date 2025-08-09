#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"
zip -r releases.zip manuallyInstall.js build
