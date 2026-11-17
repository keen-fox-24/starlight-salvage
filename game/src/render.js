// Everything drawn on the canvas: the space backdrop, the ship and the falling objects, the
// HUD, and the title, pause and game-over screens. Pure canvas vector shapes in one coherent
// palette (indigo sky, gold starlight, teal ship) — no images, no fonts to load.
import { COLORS, COMBO, FIELD, SHIP } from './config.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './state.js';

const FONT = '"Avenir Next", "Segoe UI", system-ui, sans-serif';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, { size = 16, weight = 600, color = COLORS.text, align = 'left', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  ctx.restore();
}

/** A four-point sparkle star, the shape of a star shard. */
function starPath(ctx, x, y, radius, spin) {
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = spin + (i * Math.PI) / 4;
    const r = i % 2 === 0 ? radius : radius * 0.38;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function heartPath(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.85);
  ctx.bezierCurveTo(x - size * 1.25, y, x - size * 0.7, y - size * 1.05, x, y - size * 0.3);
  ctx.bezierCurveTo(x + size * 0.7, y - size * 1.05, x + size * 1.25, y, x, y + size * 0.85);
  ctx.closePath();
}

function drawBackground(ctx, game) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  gradient.addColorStop(0, COLORS.skyTop);
  gradient.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  for (const [x, y, r, color] of [
    [210, 130, 190, COLORS.nebulaA],
    [770, 320, 230, COLORS.nebulaB],
    [520, 90, 130, COLORS.nebulaB],
  ]) {
    const nebula = ctx.createRadialGradient(x, y, 0, x, y, r);
    nebula.addColorStop(0, color);
    nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  for (const star of game.stars) {
    ctx.globalAlpha = Math.max(0.08, star.alpha ?? 0.7);
    ctx.fillStyle = star.layer === 0 ? COLORS.starDim : COLORS.starBright;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The salvage deck line: a soft horizon glow along the bottom.
  const deckGlow = ctx.createLinearGradient(0, FIELD.deckY + 26, 0, FIELD.height);
  deckGlow.addColorStop(0, 'rgba(47, 212, 196, 0.14)');
  deckGlow.addColorStop(1, 'rgba(47, 212, 196, 0)');
  ctx.fillStyle = deckGlow;
  ctx.fillRect(0, FIELD.deckY + 26, FIELD.width, FIELD.height - FIELD.deckY - 26);
  ctx.fillStyle = 'rgba(47, 212, 196, 0.35)';
  ctx.fillRect(0, FIELD.deckY + 26, FIELD.width, 2);
}

function drawShip(ctx, ship, elapsed) {
  const bobY = Math.sin(ship.bobPhase) * 3;
  const blink = ship.invulnerable > 0 && Math.floor(elapsed * 14) % 2 === 0;
  ctx.save();
  ctx.translate(ship.x, ship.y + bobY);
  ctx.rotate(ship.tilt);
  ctx.globalAlpha = blink ? 0.35 : 1;

  // Engine glow.
  const flicker = 0.75 + 0.25 * Math.sin(elapsed * 31);
  ctx.save();
  ctx.globalAlpha *= flicker;
  ctx.fillStyle = 'rgba(140, 240, 255, 0.85)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 9, 6 + 3 * flicker, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hull.
  const hull = ctx.createLinearGradient(0, -18, 0, 10);
  hull.addColorStop(0, COLORS.shipHull);
  hull.addColorStop(1, COLORS.shipHullDark);
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-36, -6);
  ctx.quadraticCurveTo(0, -18, 36, -6);
  ctx.quadraticCurveTo(30, 8, 18, 9);
  ctx.lineTo(-18, 9);
  ctx.quadraticCurveTo(-30, 8, -36, -6);
  ctx.closePath();
  ctx.fill();

  // Side pods.
  ctx.fillStyle = COLORS.shipHullDark;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * 31, -2, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glass dome.
  ctx.fillStyle = COLORS.shipDome;
  ctx.beginPath();
  ctx.arc(0, -12, 12, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(-4, -18, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // Collector ring above the dome — where shards are caught.
  ctx.save();
  ctx.shadowColor = COLORS.collector;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = COLORS.collector;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -30, 30, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawShard(ctx, shard) {
  const radius = shard.golden ? shard.radius * 1.3 : shard.radius;
  ctx.save();
  ctx.shadowColor = shard.golden ? COLORS.golden : COLORS.shard;
  ctx.shadowBlur = shard.golden ? 22 : 13;
  ctx.fillStyle = shard.golden ? COLORS.golden : COLORS.shard;
  starPath(ctx, shard.x, shard.y, radius, shard.spin);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.shardCore;
  starPath(ctx, shard.x, shard.y, radius * 0.5, shard.spin);
  ctx.fill();
  ctx.restore();
}

function drawMeteor(ctx, meteor, elapsed) {
  // Heat trail above the rock.
  const trail = ctx.createLinearGradient(0, meteor.y - meteor.radius * 2.6, 0, meteor.y);
  trail.addColorStop(0, 'rgba(255, 120, 60, 0)');
  trail.addColorStop(1, 'rgba(255, 120, 60, 0.4)');
  ctx.fillStyle = trail;
  ctx.beginPath();
  ctx.moveTo(meteor.x - meteor.radius * 0.7, meteor.y - meteor.radius * 0.4);
  ctx.lineTo(meteor.x, meteor.y - meteor.radius * (2.2 + 0.3 * Math.sin(elapsed * 23 + meteor.x)));
  ctx.lineTo(meteor.x + meteor.radius * 0.7, meteor.y - meteor.radius * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(meteor.x, meteor.y);
  ctx.rotate(meteor.spin);
  const rock = ctx.createRadialGradient(-meteor.radius * 0.3, -meteor.radius * 0.3, meteor.radius * 0.2, 0, 0, meteor.radius * 1.15);
  rock.addColorStop(0, '#d97a52');
  rock.addColorStop(1, COLORS.meteor);
  ctx.fillStyle = rock;
  ctx.beginPath();
  ctx.arc(0, 0, meteor.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(126, 53, 32, 0.6)';
  for (const crater of meteor.craters) {
    ctx.beginPath();
    ctx.arc(crater.dx, crater.dy, crater.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeart(ctx, heart, elapsed) {
  const pulse = 1 + 0.12 * Math.sin(elapsed * 5 + heart.swayPhase);
  ctx.save();
  ctx.translate(heart.x, heart.y);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = COLORS.heart;
  ctx.shadowBlur = 12;
  ctx.fillStyle = COLORS.heart;
  heartPath(ctx, 0, 0, heart.radius);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx, floaters) {
  for (const f of floaters) {
    const alpha = Math.max(0, 1 - f.age / f.life);
    text(ctx, f.text, f.x, f.y, { size: 17, weight: 800, color: f.color, align: 'center', alpha });
  }
}

function drawLives(ctx, lives) {
  for (let i = 0; i < SHIP.startLives; i += 1) {
    ctx.save();
    ctx.globalAlpha = i < lives ? 1 : 0.22;
    ctx.fillStyle = COLORS.heart;
    heartPath(ctx, 34 + i * 26, 84, 9);
    ctx.fill();
    ctx.restore();
  }
}

function drawHud(ctx, game) {
  text(ctx, 'SCORE', 24, 28, { size: 12, weight: 700, color: COLORS.textDim });
  text(ctx, String(game.score), 24, 54, { size: 30, weight: 800 });
  drawLives(ctx, game.lives);

  text(ctx, `WAVE ${game.wave}`, FIELD.width / 2, 34, { size: 20, weight: 800, align: 'center', color: '#8fd8ff' });

  text(ctx, 'BEST', FIELD.width - 24, 28, { size: 12, weight: 700, color: COLORS.textDim, align: 'right' });
  text(ctx, String(Math.max(game.best, game.score)), FIELD.width - 24, 54, { size: 24, weight: 800, align: 'right' });

  if (game.combo >= 2) {
    const multiplier = game.multiplier();
    const progress = multiplier >= COMBO.maxMultiplier ? 1 : (game.combo % COMBO.catchesPerStep) / COMBO.catchesPerStep;
    text(ctx, `COMBO ×${multiplier}`, FIELD.width - 24, 88, { size: 17, weight: 800, align: 'right', color: COLORS.shard });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    roundRect(ctx, FIELD.width - 134, 102, 110, 6, 3);
    ctx.fill();
    ctx.fillStyle = COLORS.shard;
    roundRect(ctx, FIELD.width - 134, 102, 110 * progress, 6, 3);
    ctx.fill();
  }

  text(ctx, 'P pause · M mute', FIELD.width - 24, FIELD.height - 16, { size: 12, weight: 600, color: COLORS.textDim, align: 'right', alpha: 0.8 });
}

function drawBanner(ctx, game) {
  if (game.screen !== SCREEN_PLAY || game.bannerAge >= 1.6 || game.wave < 2) return;
  const alpha = game.bannerAge < 0.25 ? game.bannerAge / 0.25 : Math.max(0, 1 - (game.bannerAge - 0.9) / 0.7);
  text(ctx, game.banner, FIELD.width / 2, 150, { size: 44, weight: 800, align: 'center', color: '#8fd8ff', alpha });
}

function panel(ctx, width, height) {
  const x = (FIELD.width - width) / 2;
  const y = (FIELD.height - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 32, 0.78)';
  roundRect(ctx, x, y, width, height, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(143, 216, 255, 0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, 18);
  ctx.stroke();
  ctx.restore();
  return { x, y };
}

function drawTitle(ctx, game) {
  const cx = FIELD.width / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(255, 215, 94, 0.55)';
  ctx.shadowBlur = 26;
  const titleGradient = ctx.createLinearGradient(0, 84, 0, 208);
  titleGradient.addColorStop(0, '#ffffff');
  titleGradient.addColorStop(1, COLORS.shard);
  ctx.font = `800 62px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = titleGradient;
  ctx.fillText('STARLIGHT', cx, 116);
  ctx.fillText('SALVAGE', cx, 180);
  ctx.restore();

  text(ctx, 'Catch the falling starlight. Dodge the meteors. Keep the combo alive.', cx, 232, {
    size: 17,
    weight: 600,
    align: 'center',
    color: COLORS.textDim,
  });

  // Legend: the three things that fall, drawn with the game's own shapes.
  const legendY = 292;
  const fakeShard = { x: cx - 268, y: legendY, radius: 11, golden: false, spin: 0.6 };
  drawShard(ctx, fakeShard);
  text(ctx, 'Star shard — catch it for points', cx - 248, legendY, { size: 15 });
  const fakeMeteor = { x: cx - 268, y: legendY + 34, radius: 13, spin: 0.4, craters: [{ dx: 3, dy: -2, r: 3.4 }, { dx: -4, dy: 4, r: 2.6 }, { dx: 1, dy: 6, r: 2 }] };
  drawMeteor(ctx, fakeMeteor, game.elapsed);
  text(ctx, 'Meteor — one hit costs a life', cx - 248, legendY + 34, { size: 15 });
  drawHeart(ctx, { x: cx - 268, y: legendY + 68, radius: 10, swayPhase: 0 }, game.elapsed);
  text(ctx, 'Repair heart — restores a life', cx - 248, legendY + 68, { size: 15 });

  text(ctx, 'Move: ← → keys, A / D, or mouse · Pause: P · Mute: M', cx, 402, {
    size: 14,
    weight: 600,
    align: 'center',
    color: COLORS.textDim,
  });

  const pulse = 0.65 + 0.35 * Math.sin(game.elapsed * 3.4);
  text(ctx, 'CLICK OR PRESS SPACE TO START', cx, 442, {
    size: 21,
    weight: 800,
    align: 'center',
    color: COLORS.shard,
    alpha: pulse,
  });

  if (game.best > 0) {
    text(ctx, `BEST ${game.best}`, cx, 486, { size: 15, weight: 700, align: 'center', color: COLORS.textDim });
  }

  // The ship itself, parked at the bottom-left as a mascot so the centred prompt stays clear.
  drawShip(ctx, { ...game.ship, x: 118, tilt: 0 }, game.elapsed);
}

function drawGameOver(ctx, game) {
  panel(ctx, 520, 330);
  const cx = FIELD.width / 2;
  text(ctx, 'GAME OVER', cx, 168, { size: 42, weight: 800, align: 'center', color: COLORS.danger });
  text(ctx, 'SCORE', cx, 222, { size: 13, weight: 700, align: 'center', color: COLORS.textDim });
  text(ctx, String(game.score), cx, 258, { size: 46, weight: 800, align: 'center', color: COLORS.shard });

  const rows = [
    ['BEST', String(Math.max(game.best, game.score))],
    ['WAVE REACHED', String(game.wave)],
    ['SHARDS CAUGHT', String(game.caught)],
  ];
  rows.forEach(([label, value], index) => {
    const y = 308 + index * 30;
    text(ctx, label, cx - 130, y, { size: 15, weight: 600, color: COLORS.textDim });
    text(ctx, value, cx + 130, y, { size: 17, weight: 800, align: 'right' });
  });

  const pulse = 0.65 + 0.35 * Math.sin(game.elapsed * 3.4);
  text(ctx, 'PRESS R OR CLICK TO RESTART', cx, 428, {
    size: 19,
    weight: 800,
    align: 'center',
    color: COLORS.shard,
    alpha: pulse,
  });
}

function drawPaused(ctx, game) {
  panel(ctx, 380, 170);
  const cx = FIELD.width / 2;
  text(ctx, 'PAUSED', cx, FIELD.height / 2 - 24, { size: 36, weight: 800, align: 'center' });
  text(ctx, 'Press P to resume', cx, FIELD.height / 2 + 26, { size: 16, weight: 600, align: 'center', color: COLORS.textDim });
}

/** Draw one whole frame of the game. */
export function drawGame(ctx, game) {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  drawBackground(ctx, game);

  // On the game-over screen the run has ended: the field is cleared so the results panel
  // reads cleanly. On the title screen the ship is drawn by drawTitle as a mascot.
  if (game.screen !== SCREEN_OVER) {
    for (const item of game.items) {
      if (item.kind === 'shard') drawShard(ctx, item);
      else if (item.kind === 'meteor') drawMeteor(ctx, item, game.elapsed);
      else drawHeart(ctx, item, game.elapsed);
    }
  }
  drawParticles(ctx, game.particles);
  if (game.screen !== SCREEN_TITLE) drawShip(ctx, game.ship, game.elapsed);
  drawFloaters(ctx, game.floaters);

  if (game.screen === SCREEN_PLAY || game.screen === SCREEN_PAUSED) {
    drawHud(ctx, game);
    drawBanner(ctx, game);
  }
  if (game.screen === SCREEN_TITLE) drawTitle(ctx, game);
  if (game.screen === SCREEN_OVER) {
    drawHud(ctx, game);
    drawGameOver(ctx, game);
  }
  if (game.screen === SCREEN_PAUSED) drawPaused(ctx, game);

  if (game.flash > 0) {
    const vignette = ctx.createRadialGradient(
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.36,
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.78,
    );
    vignette.addColorStop(0, 'rgba(255, 40, 40, 0)');
    vignette.addColorStop(1, `rgba(255, 40, 40, ${0.4 * game.flash})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
  ctx.restore();
}
