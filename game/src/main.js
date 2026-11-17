// Boot and the main loop: canvas setup, input wiring, turning game events into sound, and the
// requestAnimationFrame loop. With ?shot=<scene>&seed=<n> in the URL it instead stages one
// deterministic screenshot scene (see shots.js), draws it, and sets window.__shotReady.
import { FIELD } from './config.js';
import { SoundFX } from './audio.js';
import { spawnFloater } from './entities.js';
import { Input } from './input.js';
import { makeRng } from './random.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';
import { Game, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sound = new SoundFX();
const input = new Input(canvas, FIELD);

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? 1) || 1;
const game = new Game(shotName ? makeRng(seed) : undefined);

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function playEvents(events) {
  for (const event of events) {
    if (event === 'catch') sound.catchBlip(game.combo);
    else if (event === 'golden') sound.goldenBlip();
    else if (event === 'miss') sound.missDrop();
    else if (event === 'hit') sound.damageThud();
    else if (event === 'nearMiss') sound.nearMissWhoosh();
    else if (event === 'heart') sound.heartChime();
    else if (event === 'wave') sound.waveHorn();
    else if (event === 'over') sound.gameOverJingle();
    else if (event === 'start') sound.startJingle();
  }
}

input.onAnyGesture = () => sound.ensure();
input.onAction = () => {
  if (game.screen === SCREEN_TITLE || game.screen === SCREEN_OVER) {
    playEvents(game.start());
  }
};
input.onPause = () => {
  if (game.screen === SCREEN_PLAY || game.screen === SCREEN_PAUSED) game.togglePause();
};
input.onMute = () => {
  const muted = sound.toggleMute();
  spawnFloater(game.floaters, FIELD.width / 2, 120, muted ? 'SOUND OFF' : 'SOUND ON', '#aab4dd');
};

if (shotName) {
  stageShot(shotName, game);
  drawGame(ctx, game);
  requestAnimationFrame(() => {
    drawGame(ctx, game);
    window.__shotReady = true;
  });
} else {
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const events = game.update(dt, { direction: input.direction(), pointerX: input.pointerX });
    playEvents(events);
    drawGame(ctx, game);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
