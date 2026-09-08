#!/bin/sh
set -eu
cd "$(dirname "$0")"
node tools/setup.mjs
exec node --env-file-if-exists=.env tools/start-local.mjs
