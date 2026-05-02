"""
BrailBox Pi Kiosk — Flask + SocketIO server.

Flow:
1. User presses any key → "What story would you want to hear?"
2. Beep → listen via Whisper → get user request
3. Search Supabase for matching story
4. Read summary, ask "Is that good?"
5. If yes → read full story (audio + screen + braille, sentence by sentence)
6. Ask "Was that good or bad?" → update rating
"""

import os
import re
import sys
import time
import tempfile
import threading

import numpy as np
import sounddevice as sd
from scipy.io.wavfile import write as wav_write
from dotenv import load_dotenv
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
TOP_PIN = int(os.environ.get("SERVO_TOP_PIN", "17"))
MID_PIN = int(os.environ.get("SERVO_MID_PIN", "27"))
BOT_PIN = int(os.environ.get("SERVO_BOT_PIN", "22"))
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")
AUDIO_DEVICE = os.environ.get("AUDIO_DEVICE")
if AUDIO_DEVICE and AUDIO_DEVICE.isdigit():
    AUDIO_DEVICE = int(AUDIO_DEVICE)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Detect if running on Pi (GPIO available)
USE_GPIO = True
try:
    import gpiozero  # noqa: F401
except ImportError:
    USE_GPIO = False
    print("[warn] gpiozero not available — servo simulation mode")

from braille import BrailleDisplay  # noqa: E402

app = Flask(__name__)
app.config["SECRET_KEY"] = "brailbox-dev"
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

display = BrailleDisplay(TOP_PIN, MID_PIN, BOT_PIN, use_gpio=USE_GPIO)

# Lazy-load whisper model
_whisper_model = None

def get_whisper():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        _whisper_model = whisper.load_model(WHISPER_MODEL)
    return _whisper_model


def record_audio(duration: float = 5.0, sr: int = 16000) -> np.ndarray:
    kwargs = {"samplerate": sr, "channels": 1, "dtype": "float32"}
    if AUDIO_DEVICE is not None:
        kwargs["device"] = AUDIO_DEVICE
    audio = sd.rec(int(duration * sr), **kwargs)
    sd.wait()
    return audio.flatten()


def transcribe(audio: np.ndarray, sr: int = 16000) -> str:
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        wav_write(f.name, sr, (audio * 32767).astype(np.int16))
        result = get_whisper().transcribe(f.name, language="en")
    os.unlink(f.name)
    return result["text"].strip()


def speak_and_display(text: str, sid: str):
    """Speak text sentence by sentence, with braille + screen sync."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    for sentence in sentences:
        socketio.emit("sentence", {"text": sentence}, to=sid)

        tts_thread = threading.Thread(target=_speak, args=(sentence,))
        tts_thread.start()

        display.show_text(sentence, char_delay=0.35,
                          on_char=lambda ch: socketio.emit("braille_char", {"char": ch}, to=sid))

        tts_thread.join()
        time.sleep(0.3)


def _speak(text: str):
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty("rate", 130)
        engine.say(text)
        engine.runAndWait()
        engine.stop()
    except Exception as e:
        print(f"[tts error] {e}")


def play_beep():
    sr = 16000
    t = np.linspace(0, 0.3, int(sr * 0.3), endpoint=False)
    tone = (0.3 * np.sin(2 * np.pi * 880 * t)).astype(np.float32)
    sd.play(tone, sr)
    sd.wait()


def find_story(request_text: str):
    """Search Supabase for a story matching the user's spoken request."""
    keywords = request_text.lower().split()
    themes = ["adventure", "mystery", "romance", "comedy", "horror",
              "history", "nature", "motivational"]
    moods = ["uplifting", "dark", "funny", "emotional", "neutral"]

    matched_theme = None
    matched_mood = None
    for w in keywords:
        for t in themes:
            if t in w or w in t:
                matched_theme = t
                break
        for m in moods:
            if m in w or w in m:
                matched_mood = m
                break

    query = (supabase.table("stories")
             .select("id, summary, clean_text, theme, mood, rating_positive, rating_negative")
             .eq("is_approved", True))

    if matched_theme:
        query = query.eq("theme", matched_theme)
    if matched_mood:
        query = query.eq("mood", matched_mood)

    query = query.order("rating_positive", desc=True).limit(1)
    result = query.execute()

    if result.data:
        return result.data[0]

    # Fallback: any top-rated story
    fallback = (supabase.table("stories")
                .select("id, summary, clean_text, theme, mood, rating_positive, rating_negative")
                .eq("is_approved", True)
                .order("rating_positive", desc=True)
                .limit(1)
                .execute())
    return fallback.data[0] if fallback.data else None


def update_rating(story_id: str, positive: bool):
    col = "rating_positive" if positive else "rating_negative"
    story = supabase.table("stories").select(col).eq("id", story_id).single().execute()
    current = story.data[col]
    supabase.table("stories").update({col: current + 1}).eq("id", story_id).execute()


@app.route("/")
def index():
    return render_template("index.html")


@socketio.on("start_session")
def handle_start(data):
    sid = data.get("sid") or ""

    emit("phase", {"phase": "greeting"})
    speak_and_display("What story would you want to hear?", sid)

    emit("phase", {"phase": "listening"})
    play_beep()

    audio = record_audio(duration=6.0)
    user_request = transcribe(audio)
    emit("transcript", {"text": user_request})

    if not user_request:
        emit("phase", {"phase": "error", "message": "Could not hear you. Press any key to try again."})
        return

    story = find_story(user_request)
    if not story:
        emit("phase", {"phase": "error", "message": "No stories found. Press any key to try again."})
        return

    emit("phase", {"phase": "matched", "summary": story["summary"], "theme": story["theme"]})
    speak_and_display(story["summary"], sid)
    speak_and_display("Is that good?", sid)

    emit("phase", {"phase": "confirm_listen"})
    play_beep()
    confirm_audio = record_audio(duration=3.0)
    confirm_text = transcribe(confirm_audio).lower()
    emit("transcript", {"text": confirm_text})

    if "no" in confirm_text or "nah" in confirm_text or "nope" in confirm_text:
        emit("phase", {"phase": "idle", "message": "Okay! Press any key to try again."})
        return

    emit("phase", {"phase": "playing"})
    speak_and_display(story["clean_text"], sid)

    emit("phase", {"phase": "ask_rating"})
    speak_and_display("Was that good or bad?", sid)

    play_beep()
    rating_audio = record_audio(duration=3.0)
    rating_text = transcribe(rating_audio).lower()
    emit("transcript", {"text": rating_text})

    positive = "bad" not in rating_text and "terrible" not in rating_text
    update_rating(story["id"], positive)

    result_msg = "Thanks! Glad you liked it." if positive else "Thanks for the feedback."
    speak_and_display(result_msg, sid)
    emit("phase", {"phase": "idle", "message": result_msg})

    display.reset()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    print(f"BrailBox Pi kiosk starting on http://0.0.0.0:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False, allow_unsafe_werkzeug=True)
