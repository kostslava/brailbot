"""
BrailBox Pi Kiosk — Flask + SocketIO server.

User types what kind of story they want → Pi searches Supabase →
plays the story text on the braille servos character by character.
"""

import os

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

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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

THEMES = ["adventure", "mystery", "romance", "comedy", "horror",
          "history", "nature", "motivational"]
MOODS = ["uplifting", "dark", "funny", "emotional", "neutral"]


def find_story(request_text: str):
    keywords = request_text.lower().split()

    matched_theme = None
    matched_mood = None
    for w in keywords:
        for t in THEMES:
            if t in w or w in t:
                matched_theme = t
                break
        for m in MOODS:
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

    fallback = (supabase.table("stories")
                .select("id, summary, clean_text, theme, mood, rating_positive, rating_negative")
                .eq("is_approved", True)
                .order("rating_positive", desc=True)
                .limit(1)
                .execute())
    return fallback.data[0] if fallback.data else None


@app.route("/")
def index():
    return render_template("index.html")


@socketio.on("find_story")
def handle_find(data):
    request_text = (data.get("text") or "").strip()
    sid = data.get("sid") or ""
    if not request_text:
        emit("status", {"message": "Type what kind of story you want."})
        return

    emit("status", {"message": "Searching..."})

    story = find_story(request_text)
    if not story:
        emit("status", {"message": "No stories found. Try a different request."})
        return

    emit("story_found", {
        "summary": story["summary"],
        "theme": story["theme"],
        "mood": story["mood"],
    })
    emit("status", {"message": "Playing braille..."})
    emit("clear_braille")

    text = story["clean_text"]
    for ch in text:
        display.show_char(ch, delay=0.35)
        socketio.emit("braille_char", {"char": ch}, to=sid)

    display.reset()
    emit("status", {"message": "Done."})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    print(f"BrailBox Pi kiosk starting on http://0.0.0.0:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False, allow_unsafe_werkzeug=True)
