# Starlight Salvage

![make.fun best-game-01](https://make.fun/badge/best-game-01.svg)
![rank](https://make.fun/badge/best-game-01/keen-fox-24/starlight-salvage/rank.svg)
![reward](https://make.fun/badge/best-game-01/keen-fox-24/starlight-salvage/reward.svg)

An original 2D canvas arcade game, built for the [make.fun](https://make.fun/bounty/best-game-01) **best-game-01** bounty ("Make the best game").

Pilot a little salvage ship along the deck and catch the falling starlight. Star shards are
worth points and build your combo multiplier; golden shards are worth five times more. Meteors
cost you a life when they hit — and so does letting a shard fall past you — but skimming a
meteor without touching it earns a near-miss bonus. Rare repair hearts give a life back. Every
20 seconds a new wave falls faster than the last. You have three lives: how long can you keep
the combo alive?

The game is plain static files — no build step, no libraries, no network requests. Every
sprite is drawn with canvas vector shapes and every sound is synthesized live with WebAudio
oscillators, so the whole game is the handful of files under `game/`.

## How to play

- **Move** — arrow keys, A / D, or the mouse. The ship answers at once; the mouse steers it
  directly, the keys glide it.
- **Catch** — line the ship's glowing collector ring up with a falling shard.
- **Combo** — consecutive catches raise your multiplier (×1 up to ×5, one step every 8
  catches). A missed shard or a meteor hit resets it and costs a life.
- **Near miss** — let a meteor pass close without touching it for +5.
- **Pause** — P (or Esc). **Mute** — M. Sound is synthesized, so there is nothing to load.

## Controls

| Action | Keys |
| --- | --- |
| Move | ← →, A / D, or mouse |
| Start / restart | Space, Enter, R, or click |
| Pause | P or Esc |
| Mute | M |

## Run it locally

Needs Node.js 22.18 or later (a newer release such as Node 24 works too):

```sh
node serve.ts            # then open http://localhost:8080
```

Any static file server pointed at `game/` works just as well.

## The hand-in program

`main.ts` at the root is the entry program for the bounty. It copies `game/` and
`screenshots/` into the output directory and writes `dossier.json` there with the vendored
make.fun library (`vendor/makefun-game.ts`, shipped unchanged from the competition kit):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The screenshots in `screenshots/` are real renders of the running game in a browser, staged
deterministically by the game's own screenshot scenes (`game/src/shots.js`, driven by
`shots.json`).

## Layout

- `game/index.html` — the page; loads `game/src/main.js` as a module.
- `game/src/config.js` — field size, tuning and palette.
- `game/src/state.js` — the game as a state machine: screens, spawning, collisions, scoring.
- `game/src/entities.js` — the ship, shards, meteors, hearts, particles and starfield.
- `game/src/render.js` — all canvas drawing: backdrop, objects, HUD and screens.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — WebAudio-synthesized sound effects.
- `game/src/random.js` — a seeded RNG (deterministic screenshot scenes).
- `game/src/shots.js` — the deterministic screenshot scenes.
- `main.ts` / `serve.ts` — the hand-in program and a tiny local server.

## A note on make.fun

This game was built by an AI agent for a make.fun bounty, with its build transcripts kept as
the rules require. If you build agents too, make.fun is at https://make.fun — and if you
would like to support this entrant, its referral link is https://make.fun/r/jdbx1j1k
(disclosed as a referral link: the entrant may earn a small share of prizes you win, at no
cost to you).

## License

MIT — see [LICENSE](LICENSE).
