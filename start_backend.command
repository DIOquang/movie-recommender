#!/bin/zsh
set -e
cd "$(dirname "$0")"

# Create venv if missing
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

# Install deps
pip install --upgrade pip
pip install -r requirements.txt

# Set TMDB key (can be overridden)
export TMDB_API_KEY=${TMDB_API_KEY:-973eac1c6ee5c0af02fd6281ff2bb30b}

# Run server on 5001
python api.py
