---
name: transcribe-audio
description: Transcribe an audio file (m4a/mp3/wav/ogg/flac) to text using a locally installed whisper-family tool (mlx_whisper on Apple Silicon, openai-whisper, or whisper.cpp). Returns the transcript text and a saved .txt path. Trigger when a user provides an audio file path and asks "transcribe this", "voice to text", "录音转文字", "把这个转成文字", or when `compose-mp` needs a transcript and the user supplied an audio path. Falls back to telling the user to paste the transcript if no transcriber is on PATH.
allowed-tools: Bash, Read, Write
---

# transcribe-audio

Convert an audio file to text. Local-only — no API calls, no upload.

## Inputs

- `audio_path` (required): absolute path to an audio file. Supported extensions: `.m4a`, `.mp3`, `.wav`, `.ogg`, `.flac`, `.mp4` (audio track), `.webm`.
- `output_dir` (optional, default `.judge/transcribe-$(date +%Y%m%d-%H%M%S)/`): where to write the transcript.
- `language` (optional, default `auto`): pass through to the transcriber. Use `zh` for Chinese, `en` for English, `auto` to let whisper detect.

If `audio_path` is missing, ask once. If the path doesn't resolve to a readable file, stop and tell the user.

## Detect available transcriber

Probe in this order. Use the first one that works:

1. **mlx_whisper** (Apple Silicon, fastest): `command -v mlx_whisper`
2. **whisper** (openai-whisper, CPU/CUDA): `command -v whisper`
3. **whisper-cpp / main** (whisper.cpp binary): `command -v whisper-cpp || command -v main`
4. **None of the above** → emit the fallback message (see below) and **stop**

Run the probe via Bash. Capture which one was found.

## Transcribe

### Branch A — mlx_whisper

```bash
mkdir -p "$output_dir"
mlx_whisper "$audio_path" \
  --model mlx-community/whisper-large-v3-turbo \
  --language ${language:-auto} \
  --output-dir "$output_dir" \
  --output-format txt
```

The output file will be `$output_dir/<basename>.txt`. Read it. Return path + first 500 chars as preview.

### Branch B — openai-whisper

```bash
mkdir -p "$output_dir"
whisper "$audio_path" \
  --model large-v3 \
  --language ${language} \
  --output_dir "$output_dir" \
  --output_format txt \
  --verbose False
```

Same output convention.

### Branch C — whisper.cpp

```bash
mkdir -p "$output_dir"
# whisper.cpp wants WAV 16kHz mono. If the input isn't WAV, transcode first.
if [[ "$audio_path" != *.wav ]]; then
  ffmpeg -i "$audio_path" -ar 16000 -ac 1 -c:a pcm_s16le "$output_dir/input.wav" -y -loglevel error
  input_wav="$output_dir/input.wav"
else
  input_wav="$audio_path"
fi
whisper-cpp -m ~/.whisper-models/ggml-large-v3.bin -f "$input_wav" -otxt -of "$output_dir/transcript"
```

(Adjust model path if user has it elsewhere. Ask once if `~/.whisper-models/` doesn't exist.)

### Branch D — fallback

```
No local whisper installation detected. To transcribe locally, install one of:

  Apple Silicon (recommended):   pip install mlx-whisper
  Any platform:                  pip install openai-whisper
  Fastest CPU:                   brew install whisper-cpp (then download a ggml model)

Or paste the transcript directly in your next turn and I'll continue without transcription.
```

Stop. Do not proceed.

## Output

After successful transcription, emit:

```
Transcribed: /full/path/to/<basename>.txt
Length: <N> characters
First 500 chars:
<...>
```

Then return control. The caller (typically `compose-mp`) will read the file via the `Read` tool.

## Hard rules

- **Never** send audio to a remote API. This skill is local-only.
- **Never** fabricate a transcript. If transcription failed or the binary is missing, surface the error and stop.
- **Don't** delete the source audio file.
- **Don't** silently fall through branches. Tell the user which transcriber was used.
- **Path safety**: `audio_path` must be an absolute path, double-quoted in every shell invocation (`"$audio_path"`), and validated as a readable file (`-r`) before any `command -v` probe or transcriber call. Reject paths containing `$(`, backticks, or unescaped semicolons rather than passing them to Bash. The `output_dir` is also user-controllable — quote it the same way. Filenames with spaces, Chinese characters, or unusual punctuation are explicitly supported by the quoting; do not strip them.

## Performance notes

- mlx_whisper on M-series: ~10× realtime (10 min audio → ~1 min)
- openai-whisper CPU: ~0.5× realtime — slow, warn the user for files >5 min
- whisper.cpp: ~5× realtime with quantized models

For files > 30 min, suggest the user split with `ffmpeg -i in.m4a -f segment -segment_time 600 -c copy out_%03d.m4a` before calling.
