// Keyboard and mouse input. Movement is read as state (held keys, pointer position in field
// units); one-shot actions (start, restart, pause, mute) are delivered through callbacks that
// main.js assigns, so the game state never touches DOM events itself.

export class Input {
  constructor(canvas, field) {
    this.field = field;
    this.keys = new Set();
    /** Pointer x in field units, or null while the pointer has not moved over the canvas. */
    this.pointerX = null;
    this.onAction = null;
    this.onPause = null;
    this.onMute = null;
    this.onAnyGesture = null;

    canvas.addEventListener('pointermove', (event) => {
      this.pointerX = this.toFieldX(canvas, event.clientX);
    });
    canvas.addEventListener('pointerdown', (event) => {
      this.pointerX = this.toFieldX(canvas, event.clientX);
      this.gesture();
      if (this.onAction) this.onAction();
    });
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      this.keys.add(key);
      this.gesture();
      if (key === ' ' || key === 'enter') {
        event.preventDefault();
        if (this.onAction) this.onAction();
      } else if (key === 'r') {
        if (this.onAction) this.onAction();
      } else if (key === 'p' || key === 'escape') {
        if (this.onPause) this.onPause();
      } else if (key === 'm') {
        if (this.onMute) this.onMute();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  toFieldX(canvas, clientX) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * this.field.width;
  }

  gesture() {
    if (this.onAnyGesture) this.onAnyGesture();
  }

  /** -1, 0 or 1 from the held movement keys (arrow keys or A/D). */
  direction() {
    const left = this.keys.has('arrowleft') || this.keys.has('a');
    const right = this.keys.has('arrowright') || this.keys.has('d');
    return (right ? 1 : 0) - (left ? 1 : 0);
  }
}
