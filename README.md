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

## v2 — "Live Trading Floor"

A larger upgrade on the `v2-live-trading-floor` branch — not yet merged to
`master`. Adds, on top of everything in v1:

- A scrolling ticker tape (all 8 tickers + live price + daily change) built
  into the header, plus a tiny canvas sparkline per stock drawn from its
  existing price history.
- A canvas donut chart showing cash vs. current holdings by value, and a
  fixed buy-and-hold rival portfolio shown next to your own net worth for
  comparison (display only — never affects your win/lose checkpoints).
- A cosmetic career-title ladder (Rookie Trader → Junior Analyst → Wall
  Street Kid → Market Mogul) next to the player avatar.
- Keyboard shortcuts: number keys select a stock, Up/Down adjust share
  count, Enter buys, Escape closes the tutorial — all gated by a generic
  "is any modal open" check rather than a hardcoded list.
- A short canvas confetti burst on the WIN screen, and a compact
  end-of-game report card (best/worst closed trade, most-held stock, days
  spent in each avatar mood) on both WIN and GAME OVER.
- Market-wide "Crash Day" / "Boom Day" events (roughly once every 16 days
  advanced, a 3-7% swing applied to every stock at once) with their own
  toast, screen flash, sound, and a "Survived the Crash!" achievement —
  tuned down from an initial 8-15% swing after simulation showed that
  magnitude was hurting the diversify-and-hold win rate far more than
  expected (see commit history for the before/after numbers).
- Broker's Choice: an occasional pay/hold/ignore pop-up with a small hidden
  cost or payout, guaranteed never to fire on the same day as a market
  event.
- A first-time onboarding tour (dimmed spotlight overlay, one real UI
  element highlighted per step), auto-playing once and replayable anytime
  from the "?" button in the corner.
