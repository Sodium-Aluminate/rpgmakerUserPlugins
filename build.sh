#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

esbuild src/*.ts --platform=node --format=cjs --minify=false --legal-comments=none --outdir=build