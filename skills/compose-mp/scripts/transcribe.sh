#!/usr/bin/env bash
# transcribe.sh — thin convenience wrapper used by transcribe-audio skill.
# Most of the actual logic lives in skills/transcribe-audio/SKILL.md so Claude
# can adapt to the user's installed transcriber. This script is offered as a
# one-shot CLI for users who want to transcribe outside of a Claude session.
#
# Usage:
#   transcribe.sh <audio-path> [output-dir] [language]
#
# Example:
#   transcribe.sh ~/Recordings/meeting.m4a .judge/run-001 zh

set -euo pipefail

audio="${1:-}"
out_dir="${2:-.judge/transcribe-$(date +%Y%m%d-%H%M%S)}"
lang="${3:-auto}"

if [[ -z "$audio" || ! -r "$audio" ]]; then
  echo "usage: $0 <audio-path> [output-dir] [language]" >&2
  echo "audio file not readable: $audio" >&2
  exit 2
fi

mkdir -p "$out_dir"

if command -v mlx_whisper >/dev/null 2>&1; then
  echo "[transcribe] using mlx_whisper" >&2
  mlx_whisper "$audio" \
    --model mlx-community/whisper-large-v3-turbo \
    --language "$lang" \
    --output-dir "$out_dir" \
    --output-format txt
elif command -v whisper >/dev/null 2>&1; then
  echo "[transcribe] using openai-whisper" >&2
  whisper "$audio" \
    --model large-v3 \
    --language "$lang" \
    --output_dir "$out_dir" \
    --output_format txt \
    --verbose False
elif command -v whisper-cpp >/dev/null 2>&1 || command -v main >/dev/null 2>&1; then
  bin="$(command -v whisper-cpp || command -v main)"
  echo "[transcribe] using $bin" >&2
  model_path="${WHISPER_MODEL:-$HOME/.whisper-models/ggml-large-v3.bin}"
  if [[ ! -r "$model_path" ]]; then
    echo "model not found at $model_path — set WHISPER_MODEL env var" >&2
    exit 3
  fi
  input_wav="$audio"
  if [[ "$audio" != *.wav ]]; then
    if ! command -v ffmpeg >/dev/null 2>&1; then
      echo "ffmpeg required to transcode non-wav input for whisper-cpp" >&2
      exit 4
    fi
    input_wav="$out_dir/input.wav"
    ffmpeg -i "$audio" -ar 16000 -ac 1 -c:a pcm_s16le "$input_wav" -y -loglevel error
  fi
  "$bin" -m "$model_path" -f "$input_wav" -otxt -of "$out_dir/transcript"
else
  cat >&2 <<'EOF'
No local whisper installation detected. Install one:
  pip install mlx-whisper      # Apple Silicon (fastest)
  pip install openai-whisper   # any platform
  brew install whisper-cpp     # fast CPU
EOF
  exit 5
fi

echo "[transcribe] done. transcript dir: $out_dir" >&2
ls -1 "$out_dir"/*.txt 2>/dev/null | head -1
