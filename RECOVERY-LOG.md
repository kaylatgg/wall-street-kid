# Recovery Log — Wall Street Kid v2

**Kayla Tang — Week 3, Version Control or Die**
Branch: `v2-live-trading-floor` (tagged `v1-week3-submission` before starting)

## What I broke

For the v2 upgrade to Wall Street Kid, I built three features together — the market crash/boom events, the Broker's Choice pop-up, and the onboarding tutorial — without committing in between. That was on purpose: the assignment wanted me to find out what happens when there's no clean checkpoint to fall back to, so I picked the riskiest chunk of the build and left it as one big uncommitted block instead of the incremental commits I used for everything else.

Inside that same block, I added an Escape key shortcut to skip the tutorial, wired into the same keydown handler as the other new v2 shortcuts (number keys to pick a stock, arrows to adjust shares).

## What the error said

There wasn't a crash or a console error — it just silently didn't work. Pressing Escape while the tutorial was open did nothing. The tutorial stayed open (confirmed `tutorialVisibleAfter: true` when I checked it), no error thrown, nothing in the console. That's almost worse than a real error — there's nothing to Google.

## What I tried

First I checked `git diff HEAD` to see what had actually changed, figuring I could isolate the Escape logic and read through it. That's where the "don't commit first" decision came back to bite me: the diff was 400 lines across three files, covering the crash/boom events, Broker's Choice, and the tutorial all mixed together. There was no way to look at "just the Escape change" — it was buried in everything else I'd built in that same stretch. Every other feature I built that week had its own clean, single-feature commit; this one didn't, and I felt that difference immediately.

Since I couldn't isolate it from the diff, I had to trace the code by hand. The Escape check turned out to be sitting after a generic "is any modal open" guard that every keyboard shortcut runs through — and the tutorial gets marked with the same generic modal class as every other overlay in the game. So that early guard was quietly catching my Escape key press and returning before it ever reached the tutorial-specific code underneath.

## What actually worked

I moved the Escape check ahead of that generic guard and scoped it narrowly, so it only fires while the tutorial itself is open — checked directly, instead of going through the shared flag. Then I ran the game's full regression check and played through it myself to confirm Escape closes the tutorial and doesn't accidentally fire during the win/game-over screens or interfere with any other modal.

## Time cost

A few minutes, once I actually looked at the code by hand instead of relying on the diff. The failure itself was easy to reproduce and reason about — it just took longer to find *where* to look because the diff gave me nothing to go on.

## What I'd take from this

The lesson landed exactly the way it was supposed to: committing often isn't busywork, it's what makes a bug fixable in minutes instead of by re-reading 400 lines by hand. I got lucky that this bug had one clean cause I could trace — if it hadn't, not having a checkpoint to fall back to would have cost a lot more than a few minutes.

Smaller thing worth noting: adding the market events also meant re-checking whether the game was still fair. I re-ran the same simulation approach I'd used to originally balance the game, now with crash/boom days included, and found the numbers I'd started with actually broke it — a single crash landing near the day-15 checkpoint dropped the win rate from about 99.7% to 65.3% over 10,000 simulated runs. That wasn't a git problem, just a reminder that "it compiles and nothing crashed" doesn't mean it's actually still balanced — I had to go check the real numbers before I trusted it.
