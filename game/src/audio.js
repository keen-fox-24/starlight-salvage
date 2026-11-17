// Sound effects synthesized with WebAudio oscillators — no audio files, nothing to load. The
// context is created lazily on the first user gesture (browsers refuse it earlier). Every
// effect is a few oscillators with an envelope; the catch blip climbs in pitch as the combo
// grows, so a long streak sounds different from a single catch.

export class SoundFX {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
  }

  /** Create the context on a user gesture; safe to call on every gesture. */
  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone({ frequency, endFrequency = null, type = 'sine', start = 0, duration = 0.12, volume = 0.5 }) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + start;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, t0);
    if (endFrequency !== null) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, t0 + duration);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(t0);
    oscillator.stop(t0 + duration + 0.05);
  }

  /** A bright blip; its pitch rises with the current combo, capped so it stays pleasant. */
  catchBlip(combo) {
    const step = Math.min(combo, 24);
    const base = 520 * Math.pow(2, step / 12);
    this.tone({ frequency: base, endFrequency: base * 1.5, type: 'triangle', duration: 0.1, volume: 0.45 });
    this.tone({ frequency: base * 2, type: 'sine', duration: 0.06, volume: 0.15 });
  }

  goldenBlip() {
    this.tone({ frequency: 880, type: 'triangle', duration: 0.09, volume: 0.4 });
    this.tone({ frequency: 1174, type: 'triangle', start: 0.07, duration: 0.09, volume: 0.4 });
    this.tone({ frequency: 1568, type: 'triangle', start: 0.14, duration: 0.14, volume: 0.4 });
  }

  /** A low thud for a lost life: a falling square wave plus a noise-like low burst. */
  damageThud() {
    this.tone({ frequency: 160, endFrequency: 45, type: 'square', duration: 0.28, volume: 0.5 });
    this.tone({ frequency: 90, endFrequency: 30, type: 'sawtooth', duration: 0.3, volume: 0.3 });
  }

  missDrop() {
    this.tone({ frequency: 300, endFrequency: 110, type: 'sine', duration: 0.18, volume: 0.3 });
  }

  nearMissWhoosh() {
    this.tone({ frequency: 1200, endFrequency: 2400, type: 'sine', duration: 0.09, volume: 0.12 });
  }

  heartChime() {
    this.tone({ frequency: 660, type: 'sine', duration: 0.1, volume: 0.35 });
    this.tone({ frequency: 990, type: 'sine', start: 0.08, duration: 0.16, volume: 0.35 });
  }

  waveHorn() {
    this.tone({ frequency: 392, type: 'triangle', duration: 0.1, volume: 0.3 });
    this.tone({ frequency: 523, type: 'triangle', start: 0.09, duration: 0.1, volume: 0.3 });
    this.tone({ frequency: 659, type: 'triangle', start: 0.18, duration: 0.16, volume: 0.3 });
  }

  gameOverJingle() {
    const notes = [523, 440, 349, 262];
    notes.forEach((frequency, index) => {
      this.tone({ frequency, type: 'triangle', start: index * 0.16, duration: 0.22, volume: 0.4 });
    });
  }

  startJingle() {
    const notes = [262, 392, 523, 784];
    notes.forEach((frequency, index) => {
      this.tone({ frequency, type: 'triangle', start: index * 0.07, duration: 0.12, volume: 0.3 });
    });
  }
}
