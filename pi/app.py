"""
BrailBox Pi Kiosk — Flask + SocketIO server.

Stories are hardcoded. User picks one from a list → braille servos play it.
"""

import os
import time

from dotenv import load_dotenv
from flask import Flask, render_template, jsonify
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

STORIES = [
    {
        "id": 1,
        "summary": "After missing the last bus, Maya meets George, who shares memories of the city's past and leaves her reluctant to go.",
        "text": "Maya missed the last bus and ended up sharing a bench with an 80-year-old man named George, who had been riding that same route for 52 years. He told her about the city before the towers, before the highways, before the noise. By the time her cab arrived, she didn't want to leave.",
        "theme": "history",
        "mood": "emotional",
    },
    {
        "id": 2,
        "summary": "A building manager investigates a mysterious light in an apparently empty apartment.",
        "text": "Every night at 11:58, the light in apartment 4B turned on. Nobody lived there. The building manager said it had been empty for three years. One night, curiosity won. She knocked. An old woman answered, confused — she'd lived there for thirty years and had never left.",
        "theme": "mystery",
        "mood": "dark",
    },
    {
        "id": 3,
        "summary": "After a storm destroys a fence, two long-feuding neighbors quietly begin to connect through a shared garden.",
        "text": "Two neighbors hadn't spoken in six years over a fence dispute. Then a storm knocked the fence down. Neither of them fixed it. Slowly, a shared garden grew in the gap — tomatoes on her side, sunflowers on his. They still don't talk much, but they leave vegetables on each other's steps.",
        "theme": "nature",
        "mood": "uplifting",
    },
    {
        "id": 4,
        "summary": "A teenage cashier makes a mistake on his first shift, but a kind customer returns the extra money and leaves him with a lesson he remembers for years.",
        "text": "Darius was 16. It was his first shift at the grocery store, and he accidentally gave a woman $40 too much in change. He panicked. She noticed, came back, slid it across the counter, and said, 'The world runs on people like you noticing.' He is 34 now and still thinks about it.",
        "theme": "motivational",
        "mood": "uplifting",
    },
    {
        "id": 5,
        "summary": "When a neighborhood blackout forces everyone outside, strangers connect over music, sidewalk drawings, and shared food.",
        "text": "After the blackout hit the whole street, everyone came outside for the first time. Kids drew on the sidewalk. Someone dragged out a battery-powered speaker. A man two doors down, whom nobody knew, turned out to make incredible jerk chicken. The power came back after four hours. Nobody went inside for another three.",
        "theme": "adventure",
        "mood": "uplifting",
    },
    {
        "id": 6,
        "summary": "Patrick attends the wrong funeral, stays to hear about a stranger's devoted life, and it prompts him to call his own mother.",
        "text": "Patrick showed up to the wrong funeral. He realized it about four minutes in — the photos on the boards were of a stranger, the name on the program wasn't familiar, and nobody seemed to know him either. He should have left. Instead, something kept him in the pew. The eulogy described a man who drove three hours every week to visit his mother in a care home, who never missed a Saturday, who once turned down a promotion because it would have meant moving cities. Walking out afterward, a woman touched his arm and said, 'He would have liked that a stranger came.' Patrick called his own mother on the drive home. They talked for two hours.",
        "theme": "emotional",
        "mood": "emotional",
    },
    {
        "id": 7,
        "summary": "Nadia maps meaningful places in her own life and discovers her late grandmother did the same.",
        "text": "Nadia made maps of places nobody else thought to document. Not countries or cities — she mapped the corner store where her grandfather bought her candy every Sunday, the exact bench where she got her heart broken at nineteen, the crack in the sidewalk outside her childhood home that looked like a river delta if you squinted. When her grandmother passed, Nadia found, tucked inside one envelope, a hand-drawn map of a small village in Portugal — streets labeled in faded pencil, a bakery circled twice, a church with a small star beside it. Her grandmother had never mentioned making maps. Nadia sat on the kitchen floor for a long time, holding it. Then she added it to her collection and wrote underneath it: inherited.",
        "theme": "history",
        "mood": "emotional",
    },
    {
        "id": 8,
        "summary": "A retired teacher starts leaving tiny origami animals on park benches, sparking a city-wide hunt.",
        "text": "Mr. Ono retired after 41 years of teaching. He didn't know what to do with his hands. So he started folding — cranes, foxes, turtles — and leaving them on park benches around the city. A kid posted one online. Then another. Within a month, people were hunting for them like treasure. Mr. Ono never told anyone it was him. He just kept folding.",
        "theme": "comedy",
        "mood": "uplifting",
    },
    {
        "id": 9,
        "summary": "A girl who is afraid of the ocean learns to love it through her grandmother's stories.",
        "text": "Lena was terrified of the ocean. The sound, the size, the way it never stopped moving. Her grandmother told her the sea was just the earth breathing. Every summer they sat on the same rock and her grandmother named the waves — that one's a sigh, that one's a laugh, that one's the earth stretching after a long nap. Lena is 27 now. She lives by the coast. She still names the waves.",
        "theme": "nature",
        "mood": "uplifting",
    },
    {
        "id": 10,
        "summary": "A boy discovers his dad's hidden notebook of unsent letters and finally understands him.",
        "text": "After his father passed, Malik found a notebook in the garage labeled 'Letters I Should Have Sent.' There were dozens. One to Malik's mother, apologizing for missing their anniversary in 2003. One to a childhood friend he'd lost touch with. One to Malik himself, dated the day he graduated, that just said: 'I have never been more proud of anyone in my life. I'm sorry I couldn't say it out loud.' Malik read it four times. Then he closed the notebook and held it against his chest.",
        "theme": "emotional",
        "mood": "emotional",
    },
]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/stories")
def get_stories():
    return jsonify([{"id": s["id"], "summary": s["summary"], "theme": s["theme"], "mood": s["mood"]} for s in STORIES])


@socketio.on("play_story")
def handle_play(data):
    story_id = data.get("id")
    sid = data.get("sid") or ""

    story = next((s for s in STORIES if s["id"] == story_id), None)
    if not story:
        emit("status", {"message": "Story not found."})
        return

    emit("status", {"message": "Playing braille..."})
    emit("clear_braille")

    words = story["text"].split(" ")
    for i, word in enumerate(words):
        for ch in word:
            display.show_char(ch, delay=1.56)
            socketio.emit("braille_char", {"char": ch}, to=sid)
        if i < len(words) - 1:
            socketio.emit("braille_char", {"char": " "}, to=sid)
            display.show_char(" ", delay=0.13)
            time.sleep(2.6)

    display.reset()
    emit("status", {"message": "Done."})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    print(f"BrailBox Pi kiosk starting on http://0.0.0.0:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False, allow_unsafe_werkzeug=True)
