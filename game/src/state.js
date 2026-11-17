// The game itself as a state machine: title, playing, paused and game-over screens; spawning
// and difficulty; collisions and scoring. It owns no DOM and no audio — each update returns a
// list of event names ('catch', 'golden', 'miss', 'hit', 'nearMiss', 'heart', 'wave', 'over',
// 'start') that main.js turns into sound, and everything visual is drawn by render.js.
import { COMBO, FIELD, HEART, METEOR, SHARD, SHIP, WAVE } from './config.js';
import {
  makeHeart,
  makeMeteor,
  makeShard,
  makeShip,
  makeStarfield,
  spawnFloater,
  spawnParticles,
  updateFloaters,
  updateHeart,
  updateMeteor,
  updateParticles,
  updateShard,
  updateShip,
  updateStarfield,
} from './entities.js';
import { makeRng } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export class Game {
  constructor(rng = makeRng((Date.now() % 2147483647) + 1)) {
    this.rng = rng;
    this.stars = makeStarfield(rng);
    this.best = 0;
    this.reset(SCREEN_TITLE);
  }

  reset(screen) {
    this.screen = screen;
    this.ship = makeShip();
    this.items = [];
    this.particles = [];
    this.floaters = [];
    this.score = 0;
    this.combo = 0;
    this.lives = SHIP.startLives;
    this.caught = 0;
    this.elapsed = 0;
    this.wave = 1;
    this.shardTimer = 0.3;
    this.meteorTimer = 2.2;
    this.heartTimer = HEART.spawnEvery * 0.6;
    this.shake = 0;
    this.flash = 0;
    this.banner = '';
    this.bannerAge = 0;
  }

  start() {
    this.reset(SCREEN_PLAY);
    return ['start'];
  }

  multiplier() {
    return Math.min(COMBO.maxMultiplier, 1 + Math.floor(this.combo / COMBO.catchesPerStep));
  }

  fallScale() {
    return 1 + (this.wave - 1) * WAVE.fallScalePerWave;
  }

  togglePause() {
    if (this.screen === SCREEN_PLAY) this.screen = SCREEN_PAUSED;
    else if (this.screen === SCREEN_PAUSED) this.screen = SCREEN_PLAY;
  }

  /**
   * Advance the game by dt seconds. `control` is { direction, pointerX } from input.
   * Returns the events that happened this step, for sound and other feedback.
   */
  update(dt, control) {
    const events = [];
    updateStarfield(this.stars, dt, this.elapsed + dt);
    if (this.screen === SCREEN_TITLE || this.screen === SCREEN_OVER) {
      this.elapsed += dt;
      updateParticles(this.particles, dt);
      updateFloaters(this.floaters, dt);
      this.ship.bobPhase += dt * 2.4;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.2);
      return events;
    }
    if (this.screen === SCREEN_PAUSED) return events;

    this.elapsed += dt;
    updateShip(this.ship, dt, control.direction, control.pointerX);

    const newWave = 1 + Math.floor(this.elapsed / WAVE.secondsPerWave);
    if (newWave !== this.wave) {
      this.wave = newWave;
      this.banner = `WAVE ${this.wave}`;
      this.bannerAge = 0;
      events.push('wave');
    }
    if (this.bannerAge < 2) this.bannerAge += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.2);

    this.spawn(dt);
    this.stepItems(dt, events);
    updateParticles(this.particles, dt);
    updateFloaters(this.floaters, dt);
    return events;
  }

  spawn(dt) {
    const scale = this.fallScale();
    this.shardTimer -= dt;
    if (this.shardTimer <= 0) {
      this.items.push(makeShard(this.rng, scale));
      const interval = Math.max(
        WAVE.shardIntervalMin,
        WAVE.shardIntervalStart - (this.wave - 1) * WAVE.shardIntervalPerWave,
      );
      this.shardTimer = interval * this.rng.range(0.72, 1.28);
    }
    this.meteorTimer -= dt;
    if (this.meteorTimer <= 0) {
      this.items.push(makeMeteor(this.rng, scale));
      const interval = Math.max(
        WAVE.meteorIntervalMin,
        WAVE.meteorIntervalStart - (this.wave - 1) * WAVE.meteorIntervalPerWave,
      );
      this.meteorTimer = interval * this.rng.range(0.75, 1.3);
    }
    this.heartTimer -= dt;
    if (this.heartTimer <= 0) {
      this.items.push(makeHeart(this.rng));
      this.heartTimer = HEART.spawnEvery * this.rng.range(0.8, 1.3);
    }
  }

  stepItems(dt, events) {
    const ship = this.ship;
    for (const item of this.items) {
      if (!item.active) continue;
      if (item.kind === 'shard') updateShard(item, dt, this.elapsed);
      else if (item.kind === 'meteor') updateMeteor(item, dt);
      else updateHeart(item, dt, this.elapsed);

      const dx = Math.abs(item.x - ship.x);
      const inCatchBand = item.y > ship.y - 26 && item.y < ship.y + 16;

      if (item.kind === 'shard' && inCatchBand && dx < SHIP.catchHalfWidth) {
        item.active = false;
        this.catchShard(item, events);
      } else if (item.kind === 'heart' && inCatchBand && dx < SHIP.catchHalfWidth) {
        item.active = false;
        this.collectHeart(item, events);
      } else if (item.kind === 'meteor') {
        this.checkMeteor(item, dx, events);
      }

      if (item.active && item.y - item.radius > FIELD.height) {
        item.active = false;
        if (item.kind === 'shard') this.missShard(item, events);
      }
    }
    this.items = this.items.filter((item) => item.active);
  }

  catchShard(shard, events) {
    this.combo += 1;
    this.caught += 1;
    const points = (shard.golden ? SHARD.goldenPoints : SHARD.points) * this.multiplier();
    this.score += points;
    spawnParticles(this.particles, shard.x, this.ship.y - 18, shard.golden ? '#ffb52e' : '#ffd75e', shard.golden ? 16 : 10);
    spawnFloater(this.floaters, shard.x, this.ship.y - 52, `+${points}`, shard.golden ? '#ffb52e' : '#fff3c4');
    events.push(shard.golden ? 'golden' : 'catch');
  }

  collectHeart(heart, events) {
    if (this.lives < SHIP.startLives) {
      this.lives += 1;
      spawnFloater(this.floaters, heart.x, this.ship.y - 52, '+1 LIFE', '#ff7d9c');
    } else {
      this.score += HEART.fullPoints;
      spawnFloater(this.floaters, heart.x, this.ship.y - 52, `+${HEART.fullPoints}`, '#ff7d9c');
    }
    spawnParticles(this.particles, heart.x, this.ship.y - 18, '#ff7d9c', 14);
    events.push('heart');
  }

  checkMeteor(meteor, dx, events) {
    const ship = this.ship;
    const dy = meteor.y - (ship.y + 6);
    const distance = Math.hypot(dx, dy);
    if (distance < meteor.radius + 26) {
      meteor.active = false;
      spawnParticles(this.particles, meteor.x, meteor.y, '#c65a3d', 18, 210);
      if (ship.invulnerable <= 0) {
        this.loseLife(events, 'hit');
        this.shake = 9;
      }
      return;
    }
    if (
      !meteor.nearMissCounted &&
      meteor.y > ship.y - 6 &&
      distance < METEOR.nearMissDistance &&
      ship.invulnerable <= 0
    ) {
      meteor.nearMissCounted = true;
      this.score += METEOR.nearMissPoints;
      spawnFloater(this.floaters, ship.x, ship.y - 62, `NEAR MISS +${METEOR.nearMissPoints}`, '#8fd8ff');
      events.push('nearMiss');
    }
  }

  missShard(shard, events) {
    spawnFloater(this.floaters, shard.x, FIELD.height - 30, 'MISSED', '#ff5a5a');
    if (this.ship.invulnerable <= 0) this.loseLife(events, 'miss');
    else this.combo = 0;
  }

  loseLife(events, cause) {
    this.lives -= 1;
    this.combo = 0;
    this.flash = 1;
    this.ship.invulnerable = SHIP.invulnerableSeconds;
    events.push(cause);
    if (this.lives <= 0) {
      this.lives = 0;
      this.best = Math.max(this.best, this.score);
      this.screen = SCREEN_OVER;
      events.push('over');
    }
  }
}
