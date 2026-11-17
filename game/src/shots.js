// Deterministic screenshot scenes behind ?shot=title|play|over&seed=N. Each scene runs the
// real game forward from a fresh state at a fixed step, steered by a simple autopilot, so the
// frame is what an actual short game looks like and the same seed always stages the same
// frame. The scenes exist so the entry's screenshots are reproducible renders of the game
// itself, never edited or composited.
import { FIELD } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY } from './state.js';

const STEP = 1 / 60;
const PLAY_SECONDS = 16;
const OVER_AUTOPILOT_SECONDS = 9;
const OVER_LIMIT_SECONDS = 150;

/** Steer toward the most urgent shard, sidestepping any meteor about to land there. */
function autopilotControl(game) {
  let target = null;
  for (const item of game.items) {
    if (item.kind !== 'shard') continue;
    if (target === null || item.y > target.y) target = item;
  }
  let x = target === null ? FIELD.width / 2 : target.x;
  for (const item of game.items) {
    if (item.kind !== 'meteor') continue;
    if (item.y > 140 && Math.abs(item.x - x) < 100) {
      x = item.x + (x <= item.x ? -140 : 140);
    }
  }
  return { direction: 0, pointerX: Math.max(50, Math.min(FIELD.width - 50, x)) };
}

function stepSeconds(game, seconds, controlFor) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    game.update(STEP, controlFor(game));
    if (game.screen === SCREEN_OVER) break;
  }
}

const idleControl = () => ({ direction: 0, pointerX: null });

/**
 * Stage the named scene on `game` (built with a seeded RNG) and leave it ready to draw.
 * Any name other than play or over stages the title.
 */
export function stageShot(name, game) {
  if (name === 'play') {
    game.start();
    stepSeconds(game, PLAY_SECONDS, autopilotControl);
    if (game.screen !== SCREEN_PLAY) {
      // The autopilot had a bad run; restage from the top with the same seed stream.
      game.start();
      stepSeconds(game, PLAY_SECONDS * 0.6, autopilotControl);
    }
    return;
  }
  if (name === 'over') {
    game.start();
    stepSeconds(game, OVER_AUTOPILOT_SECONDS, autopilotControl);
    // Then park the ship at the left edge and let the misses and meteors finish the run.
    stepSeconds(game, OVER_LIMIT_SECONDS, () => ({ direction: 0, pointerX: 36 }));
    // Settle on the game-over screen itself (stepSeconds stops at game over by design):
    // let the damage flash fade and the last floaters finish before the frame is taken.
    for (let i = 0; i < Math.round(1.3 / STEP); i += 1) game.update(STEP, idleControl());
    return;
  }
  stepSeconds(game, 2.5, idleControl);
}
