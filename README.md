# Wall Street Kid

A browser recreation of the 1990 NES game *Wall Street Kid*, built as a
week-by-week class project. Plain HTML/CSS/JavaScript — no framework, no
build step, no dependencies. Open `index.html` and play.

## The game

You start with **$500,000**. Over **30 in-game days**, buy and sell shares
in 8 fictional companies, using daily news headlines (each tied to one
sector, predicting the *next* day's move) to time your trades. Two
checkpoints decide the game:

- **Day 15**: net worth must be at least **$600,000**, or it's Game Over.
- **Day 30**: net worth must be at least **$800,000** to win.

## How to run it

No install, no server. Clone or download the repo and open `index.html`
directly in a browser.

```bash
git clone https://github.com/kaylatgg/wall-street-kid.git
cd wall-street-kid
open index.html   # macOS; on other platforms just double-click it
```

## Features (v1)

- Retro NES-style UI: pixel display font for titles/labels, a plainer
  monospace for dense text, a fixed one-screen layout (no scrolling) with a
  CRT scanline/vignette overlay.
- A drift + volatility random-walk price engine, tuned via simulation so a
  simple diversify-and-hold strategy reliably clears both checkpoints.
- Sector-tagged news headlines that predict the *next* day's price move for
  one sector (or the whole market), not something that already happened.
- Buy/sell trading with cash and share validation, live net worth tracking,
  and a per-stock gain/loss column (vs. your own average cost basis).
- A reactive player avatar: a pace-based mood (happy/neutral/stressed, with
  a grace period for new players) plus a day-over-day flash reaction with a
  bounce animation on every Advance Day.
- 9 one-time achievement toasts (First Trade, Diversified, Profit Taker,
  Comeback Kid, and others), each with its own condition.
- Generated retro sound effects (Web Audio API, no external audio files)
  for trades, day advances, achievements, and checkpoints, with a mute
  toggle.
- Win / Game Over screens with a full state reset on "Play Again".

## Tech notes

Everything lives in three files: `index.html`, `style.css`, `app.js`. Pixel
art (both character portraits) is generated at runtime from a small
grid-based format, not image assets. Sound effects are synthesized
oscillator tones, not audio files. The only external dependency is the
Google Fonts CDN (Press Start 2P / VT323); if that's unreachable the game
still runs, just with a plainer fallback font.

## v2 — "Live Trading Floor" (in progress)

A larger upgrade is in progress on the `v2-live-trading-floor` branch —
not yet merged to `master`. Planned/in-progress additions include a live
ticker tape, per-stock sparklines, a portfolio allocation chart, market-wide
event days, a rival portfolio to compare against, a first-time-user
onboarding tour, and more. This section will be filled in with the actual
final feature list once that branch is reviewed and merged.
