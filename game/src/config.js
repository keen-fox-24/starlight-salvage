// Starlight Salvage — shared tuning: field size, ship and falling-object numbers, wave scaling
// and the colour palette. Everything visual or numeric that more than one module needs lives
// here, so the game's feel can be tuned from one place.

export const FIELD = {
  width: 960,
  height: 540,
  /** The deck line the salvage ship hovers on, measured from the top of the field. */
  deckY: 452,
};

export const SHIP = {
  width: 68,
  height: 46,
  /** Horizontal speed in field units per second when a direction key is held. */
  speed: 560,
  /** Half-width of the collector ring: a shard this close to the ship's centre is caught. */
  catchHalfWidth: 46,
  startLives: 3,
  /** Seconds of blinking invulnerability after a life is lost. */
  invulnerableSeconds: 1.6,
};

export const SHARD = {
  radius: 11,
  /** Base fall speed range before the wave scale is applied. */
  fallMin: 148,
  fallMax: 208,
  /** Sideways sway: amplitude in units, speed in radians per second. */
  swayAmplitude: 14,
  swaySpeed: 2.2,
  points: 10,
  /** A golden shard is worth this many points and falls a little faster. */
  goldenPoints: 50,
  goldenChance: 0.09,
  goldenFallScale: 1.18,
};

export const METEOR = {
  radiusMin: 15,
  radiusMax: 26,
  fallMin: 225,
  fallMax: 315,
  /** A meteor passing within this distance of the ship's centre, without hitting, is a near miss. */
  nearMissDistance: 86,
  nearMissPoints: 5,
};

export const HEART = {
  radius: 11,
  fall: 128,
  /** Average seconds between repair-heart spawns while playing. */
  spawnEvery: 31,
  fullPoints: 25,
};

export const WAVE = {
  /** Seconds of play per wave; each new wave falls faster and spawns more. */
  secondsPerWave: 20,
  fallScalePerWave: 0.17,
  shardIntervalStart: 0.82,
  shardIntervalPerWave: 0.065,
  shardIntervalMin: 0.34,
  meteorIntervalStart: 2.7,
  meteorIntervalPerWave: 0.22,
  meteorIntervalMin: 0.95,
};

export const COMBO = {
  /** Catches per multiplier step: the multiplier is 1 + floor(combo / catchesPerStep), capped. */
  catchesPerStep: 8,
  maxMultiplier: 5,
};

export const COLORS = {
  skyTop: '#0a0e2a',
  skyBottom: '#241447',
  nebulaA: 'rgba(88, 60, 180, 0.20)',
  nebulaB: 'rgba(20, 120, 160, 0.16)',
  starDim: '#8fa3d9',
  starBright: '#ffffff',
  shipHull: '#2fd4c4',
  shipHullDark: '#159a90',
  shipDome: '#bfefff',
  collector: '#ffe9a3',
  shard: '#ffd75e',
  shardCore: '#fff3c4',
  golden: '#ffb52e',
  meteor: '#c65a3d',
  meteorDark: '#7e3520',
  heart: '#ff7d9c',
  text: '#f4f6ff',
  textDim: '#aab4dd',
  danger: '#ff5a5a',
  good: '#7dffb0',
};
