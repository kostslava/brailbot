"""
BrailBox Pi Kiosk — Flask + SocketIO server.

User types text on the site → text is sent to the Pi → servos display it in braille,
character by character, synced with the on-screen display.
"""

import os

from dotenv import load_dotenv
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

load_dotenv()

TOP_PIN = int(os.environ.get("SERVO_TOP_PIN", "17"))
MID_PIN = int(os.environ.get("SERVO_MID_PIN", "27"))
BOT_PIN = int(os.environ.get("SERVO_BOT_PIN", "22"))

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


@app.route("/")
def index():
    return render_template("index.html")


@socketio.on("send_text")
def handle_text(data):
    text = (data.get("text") or "").strip()
    if not text:
        emit("status", {"message": "No text provided."})
        return

    emit("status", {"message": "Playing braille..."})
    emit("clear")

    for ch in text:
        display.show_char(ch, delay=0.35)
        socketio.emit("braille_char", {"char": ch}, to=data.get("sid"))

    display.reset()
    emit("status", {"message": "Done."})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    print(f"BrailBox Pi kiosk starting on http://0.0.0.0:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False, allow_unsafe_werkzeug=True)
