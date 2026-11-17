// The things that move: the salvage ship, falling star shards, meteors, repair hearts, and the
// short-lived visual feedback (sparkle particles and floating score text), plus the parallax
// starfield behind everything. Factories and updaters live here; drawing them lives in
// render.js and the rules that spawn and collide them live in state.js.
import { FIELD, HEART, METEOR, SHARD, SHIP } from './config.js';

export function makeShip() {
  return {
    x: FIELD.width / 2,
    y: FIELD.deckY,
    tilt: 0,
    bobPhase: 0,
    invulnerable: 0,
  };
}

/** Move the ship toward a keyboard direction or a pointer target, keeping it on the field. */
export function updateShip(ship, dt, direction, pointerX) {
  if (pointerX !== null && direction === 0) {
    const delta = pointerX - ship.x;
    const step = Math.max(-SHIP.speed * 1.6 * dt, Math.min(SHIP.speed * 1.6 * dt, delta));
    ship.x += step;
    ship.tilt = Math.max(-0.22, Math.min(0.22, delta / 260));
  } else {
    ship.x += direction * SHIP.speed * dt;
    ship.tilt = direction * 0.18;
  }
  const half = SHIP.width / 2 + 6;
  ship.x = Math.max(half, Math.min(FIELD.width - half, ship.x));
  ship.bobPhase += dt * 2.4;
  if (ship.invulnerable > 0) ship.invulnerable -= dt;
}

export function makeShard(rng, fallScale) {
  const golden = rng.chance(SHARD.goldenChance);
  return {
    kind: 'shard',
    golden,
    x: rng.range(30, FIELD.width - 30),
    y: -20,
    radius: SHARD.radius,
    fall: rng.range(SHARD.fallMin, SHARD.fallMax) * fallScale * (golden ? SHARD.goldenFallScale : 1),
    swayPhase: rng.range(0, Math.PI * 2),
    spin: rng.range(0, Math.PI * 2),
    spinSpeed: rng.range(-1.4, 1.4),
    active: true,
  };
}

export function updateShard(shard, dt, elapsed) {
  shard.y += shard.fall * dt;
  shard.x += Math.sin(elapsed * SHARD.swaySpeed + shard.swayPhase) * SHARD.swayAmplitude * dt;
  shard.spin += shard.spinSpeed * dt;
}

export function makeMeteor(rng, fallScale) {
  const radius = rng.range(METEOR.radiusMin, METEOR.radiusMax);
  return {
    kind: 'meteor',
    x: rng.range(30, FIELD.width - 30),
    y: -40,
    radius,
    fall: rng.range(METEOR.fallMin, METEOR.fallMax) * fallScale,
    drift: rng.range(-26, 26),
    spin: rng.range(0, Math.PI * 2),
    spinSpeed: rng.range(-2.2, 2.2),
    craters: [
      { dx: radius * 0.3, dy: -radius * 0.2, r: radius * 0.26 },
      { dx: -radius * 0.35, dy: radius * 0.3, r: radius * 0.2 },
      { dx: radius * 0.05, dy: radius * 0.45, r: radius * 0.15 },
    ],
    nearMissCounted: false,
    active: true,
  };
}

export function updateMeteor(meteor, dt) {
  meteor.y += meteor.fall * dt;
  meteor.x += meteor.drift * dt;
  meteor.spin += meteor.spinSpeed * dt;
}

export function makeHeart(rng) {
  return {
    kind: 'heart',
    x: rng.range(40, FIELD.width - 40),
    y: -20,
    radius: HEART.radius,
    fall: HEART.fall,
    swayPhase: rng.range(0, Math.PI * 2),
    active: true,
  };
}

export function updateHeart(heart, dt, elapsed) {
  heart.y += heart.fall * dt;
  heart.x += Math.sin(elapsed * 1.8 + heart.swayPhase) * 10 * dt;
}

/** A burst of short-lived sparkles, used on catches, pickups and explosions. */
export function spawnParticles(particles, x, y, color, count, speed = 150) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
    const velocity = speed * (0.35 + Math.random() * 0.75);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 40,
      life: 0.45 + Math.random() * 0.3,
      age: 0,
      size: 1.6 + Math.random() * 2.4,
      color,
    });
  }
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.life) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt;
  }
}

/** Floating score text ("+10", "NEAR MISS +5") that rises and fades. */
export function spawnFloater(floaters, x, y, text, color) {
  floaters.push({ x, y, text, color, age: 0, life: 0.95 });
}

export function updateFloaters(floaters, dt) {
  for (let i = floaters.length - 1; i >= 0; i -= 1) {
    const f = floaters[i];
    f.age += dt;
    f.y -= 44 * dt;
    if (f.age >= f.life) floaters.splice(i, 1);
  }
}

/** Two layers of background stars drifting down at different speeds, twinkling as they go. */
export function makeStarfield(rng) {
  const stars = [];
  for (let i = 0; i < 110; i += 1) {
    const layer = i < 70 ? 0 : 1;
    stars.push({
      x: rng.range(0, FIELD.width),
      y: rng.range(0, FIELD.height),
      size: layer === 0 ? rng.range(0.7, 1.5) : rng.range(1.4, 2.4),
      speed: layer === 0 ? 9 : 22,
      twinklePhase: rng.range(0, Math.PI * 2),
      layer,
    });
  }
  return stars;
}

export function updateStarfield(stars, dt, elapsed) {
  for (const star of stars) {
    star.y += star.speed * dt;
    if (star.y > FIELD.height + 3) {
      star.y = -3;
      star.x = Math.random() * FIELD.width;
    }
    star.alpha = 0.45 + 0.4 * Math.sin(elapsed * 2 + star.twinklePhase);
  }
}
