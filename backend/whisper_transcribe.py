import whisper
import sys
import io
import json

model = whisper.load_model("base")
audio_data = sys.stdin.buffer.read()

audio_file = io.BytesIO(audio_data)
result = model.transcribe(audio_file)

print(json.dumps({"transcription": result["text"]}))
sys.stdout.flush()
