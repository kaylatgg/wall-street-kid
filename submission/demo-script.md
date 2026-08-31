# Wall Street Kid — Demo Video Beat Sheet

Beats, not a word-for-word script — know these, don't read them.

## 0:00–0:10 — Who, what, one sentence
"I'm Kayla Tang, this is Week 3, and this is Wall Street Kid — a browser
recreation of the 1990 NES stock-trading game. You start with $500,000 and
have 30 days to grow it to $800,000 by trading eight fictional companies."

## 0:10–0:45 — Show it working (no code, just drive it)
Narrate where the mouse is going and what's loading — never silent.

1. Point at the news headline: "Every day there's a tip like this one —
   [read whatever's on screen] — it tells you what's about to move, before
   it moves."
2. Pick the stock it's about, buy some shares.
3. Click Advance Day. Point at what happens: price flashes, the CHANGE/
   GAIN-LOSS columns update, the avatar reacts, a little floating +$/-$
   number pops near it.
4. Click through 2-3 more days quickly. If an achievement toast fires,
   point at it: "there's a light achievement layer on top — first trade,
   diversifying, things like that."
5. If you can time it — show a checkpoint pass or the win/game-over screen.
   If not, just say "at day 15 and day 30 there's a checkpoint — miss it
   and it's game over, clear day 30 and you win."

## 0:45–1:15 — One hard thing, and how you got past it
Pick ONE of these (both are true and both are strong — go with whichever
you can tell most naturally):

**Option A — tuning the difficulty with data, not guesswork:**
"The hardest part wasn't a bug, it was balance. My first version had stock
prices move as a pure random walk — no upward bias — which meant winning
was basically a coin flip. I fixed that by adding a daily upward drift, but
picking the *right* number wasn't obvious, so I wrote a script to simulate
hundreds of playthroughs at different drift values. At 1.5% a day, a
sensible diversify-and-hold strategy only won about 30% of the time. At 2%,
it won 99%. That's the number that's in the game now — I didn't just eyeball
it, I measured it."

**Option B — debugging something that "looked right" but wasn't reacting:**
"There's a character avatar that's supposed to react to how you're doing —
happy if you're ahead, stressed if you're behind. Early on it basically
never changed expression, and the bug wasn't obvious — the code was
running, the numbers were right, it just turned out the thresholds for
'happy' and 'stressed' were too wide for how tightly the price math kept
net worth near the target pace. I found that by adding a temporary on-screen
debug readout and watching the actual numbers change in real time instead
of just assuming the logic was right, then tightened the thresholds until
it visibly reacted within the first week of a playthrough instead of half
the game later."

## 1:15+ — What you'd do with another week (optional but strong)
Pick 2-3, keep it quick:
- A persisted high-score / best-net-worth tracker in localStorage across
  playthroughs (planned from the start, never got to it)
- A small price-history sparkline per stock in the info popup
- Mobile-responsive layout
- More companies/sectors for more variety on longer playthroughs

## The one rule
Never narrate silence. If something's loading or you're moving the mouse,
say where you're going and why. Don't re-record for "um" — only re-record
if it actually breaks or the mic wasn't on.
