#!/bin/sh
set -e
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
chmod +x .githooks/pre-push .githooks/commit-msg .githooks/pre-commit 2>/dev/null || true
echo "hooksPath=.githooks"
