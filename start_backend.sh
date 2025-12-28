#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Create venv if missing
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

export TMDB_API_KEY=${TMDB_API_KEY:-973eac1c6ee5c0af02fd6281ff2bb30b}

# Use gunicorn if available for stability
if command -v gunicorn >/dev/null 2>&1; then
  exec gunicorn -w 1 -b 0.0.0.0:5001 api:app
else
  exec python api.py
fi
