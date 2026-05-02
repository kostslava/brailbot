"""
Braille encoding and servo control for BrailBox.

Each braille character is a 2x3 dot matrix:
    [1] [4]
    [2] [5]
    [3] [6]

Each servo represents one ROW (top, mid, bot). A servo can show:
  - 2 dots (both left+right): 90 degrees (middle)
  - 1 dot right only:         ~15 degrees
  - 1 dot left only:          ~165 degrees
  - 0 dots:                   0 or 180, whichever is closest to current position

3 servos = 3 rows = 6 dot positions = 1 braille character.
"""

import time

BRAILLE_MAP: dict[str, list[int]] = {}

def _build_map():
    raw = {
        'a': [1,0,0,0,0,0], 'b': [1,1,0,0,0,0], 'c': [1,0,0,1,0,0],
        'd': [1,0,0,1,1,0], 'e': [1,0,0,0,1,0], 'f': [1,1,0,1,0,0],
        'g': [1,1,0,1,1,0], 'h': [1,1,0,0,1,0], 'i': [0,1,0,1,0,0],
        'j': [0,1,0,1,1,0], 'k': [1,0,1,0,0,0], 'l': [1,1,1,0,0,0],
        'm': [1,0,1,1,0,0], 'n': [1,0,1,1,1,0], 'o': [1,0,1,0,1,0],
        'p': [1,1,1,1,0,0], 'q': [1,1,1,1,1,0], 'r': [1,1,1,0,1,0],
        's': [0,1,1,1,0,0], 't': [0,1,1,1,1,0], 'u': [1,0,1,0,0,1],
        'v': [1,1,1,0,0,1], 'w': [0,1,0,1,1,1], 'x': [1,0,1,1,0,1],
        'y': [1,0,1,1,1,1], 'z': [1,0,1,0,1,1],
        ' ': [0,0,0,0,0,0],
        '.': [0,0,1,0,1,0], ',': [0,1,0,0,0,0], '!': [0,1,1,0,1,0],
        '?': [0,1,0,0,1,1], "'": [0,0,0,1,0,0], '-': [0,0,1,0,0,1],
        '0': [0,1,0,1,1,0], '1': [1,0,0,0,0,0], '2': [1,1,0,0,0,0],
        '3': [1,0,0,1,0,0], '4': [1,0,0,1,1,0], '5': [1,0,0,0,1,0],
        '6': [1,1,0,1,0,0], '7': [1,1,0,1,1,0], '8': [1,1,0,0,1,0],
        '9': [0,1,0,1,0,0],
    }
    BRAILLE_MAP.update(raw)

_build_map()


def char_to_rows(ch: str) -> list[tuple[bool, bool]]:
    """Return [(left, right)] for top, mid, bot rows."""
    dots = BRAILLE_MAP.get(ch.lower(), [0,0,0,0,0,0])
    return [
        (bool(dots[0]), bool(dots[3])),  # top:  dot1, dot4
        (bool(dots[1]), bool(dots[4])),  # mid:  dot2, dot5
        (bool(dots[2]), bool(dots[5])),  # bot:  dot3, dot6
    ]


def row_to_angle(left: bool, right: bool, current_angle: float) -> float:
    if left and right:
        return 90.0
    if right and not left:
        return 15.0
    if left and not right:
        return 165.0
    # 0 dots: go to nearest extreme
    return 0.0 if current_angle < 90 else 180.0


class BrailleDisplay:
    def __init__(self, top_pin: int, mid_pin: int, bot_pin: int, use_gpio: bool = True):
        self.use_gpio = use_gpio
        self.current_angles = [90.0, 90.0, 90.0]  # top, mid, bot

        if use_gpio:
            from gpiozero import AngularServo
            from gpiozero.pins.pigpio import PiGPIOFactory
            factory = PiGPIOFactory()
            self.servos = [
                AngularServo(top_pin, min_angle=0, max_angle=180,
                             min_pulse_width=0.0005, max_pulse_width=0.0025,
                             pin_factory=factory),
                AngularServo(mid_pin, min_angle=0, max_angle=180,
                             min_pulse_width=0.0005, max_pulse_width=0.0025,
                             pin_factory=factory),
                AngularServo(bot_pin, min_angle=0, max_angle=180,
                             min_pulse_width=0.0005, max_pulse_width=0.0025,
                             pin_factory=factory),
            ]
            for s in self.servos:
                s.angle = 90
        else:
            self.servos = []

    def show_char(self, ch: str, delay: float = 0.15):
        rows = char_to_rows(ch)
        for i, (left, right) in enumerate(rows):
            target = row_to_angle(left, right, self.current_angles[i])
            self.current_angles[i] = target
            if self.use_gpio:
                self.servos[i].angle = target
        time.sleep(delay)

    def show_text(self, text: str, char_delay: float = 0.4, on_char=None):
        for ch in text:
            self.show_char(ch, delay=char_delay)
            if on_char:
                on_char(ch)

    def reset(self):
        for i in range(3):
            self.current_angles[i] = 90.0
            if self.use_gpio:
                self.servos[i].angle = 90
