#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
HOST="${HOST:-0.0.0.0}" PORT="${PORT:-7860}" .venv/bin/python app.py
