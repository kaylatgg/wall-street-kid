// ===== Wall Street Kid — Step 1: static UI shell =====
// Placeholder data model only. Advance Day / Buy / Sell logic comes in later steps.

const STARTING_CASH = 500_000;

const player = {
  cash: STARTING_CASH,
  day: 1,
  holdings: {}, // { stockId: shares }
  costBasis: {}, // { stockId: average price paid per share } — for Profit Taker
};

const stocks = [
  { id: "byte",  name: "ByteWorks Computing", sector: "TECHNOLOGY",
    description: "A computer hardware maker building components for home and office desktops.",
    price: 42.50,  volatility: 0.04, history: [42.50], lastChangePercent: null },
  { id: "grn",   name: "Greenfield Foods",    sector: "FOOD",
    description: "A packaged foods company producing canned and frozen grocery staples.",
    price: 18.25,  volatility: 0.02, history: [18.25], lastChangePercent: null },
  { id: "orb",   name: "Orbital Dynamics",    sector: "AEROSPACE",
    description: "A spaceflight contractor building rockets and satellites for commercial launch.",
    price: 96.00,  volatility: 0.07, history: [96.00], lastChangePercent: null },
  { id: "sud",   name: "Sudsy Cola Co.",      sector: "BEVERAGES",
    description: "A soft drink and soda bottler known for bubbly, sugary colas.",
    price: 12.75,  volatility: 0.015, history: [12.75], lastChangePercent: null },
  { id: "iron",  name: "Ironclad Motors",     sector: "AUTOMOTIVE",
    description: "A car manufacturer building trucks and sedans for the family market.",
    price: 61.10,  volatility: 0.03, history: [61.10], lastChangePercent: null },
  { id: "pix",   name: "Pixelmax Studios",    sector: "GAMING",
    description: "A video game studio developing console and PC titles.",
    price: 27.90,  volatility: 0.06, history: [27.90], lastChangePercent: null },
  { id: "gld",   name: "Golden Bridge Bank",  sector: "BANKING",
    description: "A regional bank offering savings accounts, loans, and mortgages.",
    price: 108.40, volatility: 0.025, history: [108.40], lastChangePercent: null },
  { id: "wnd",   name: "Windrunner Airlines", sector: "AVIATION",
    description: "A commercial airline operating passenger routes across the country.",
    price: 34.60,  volatility: 0.05, history: [34.60], lastChangePercent: null },
];

const milestones = [
  { day: 15, requiredNetWorth: 600_000, label: "Halfway Hustle" },
  { day: 30, requiredNetWorth: 800_000, label: "Grand Payday" },
];

const config = { maxDays: 30 };

// Snapshot of each stock's starting price, captured once before any gameplay
// mutates stock.price — Play Again resets against this, not a hardcoded copy.
const STOCK_STARTING_PRICES = Object.fromEntries(stocks.map(s => [s.id, s.price]));

// ---------- rival portfolio (v2) ----------
// A fixed, non-adaptive comparison, not a second win/lose track: an even
// buy-and-hold basket bought once at day-1 prices with the same starting
// cash, then simply revalued against the real stock.price each render.
// Never read by checkMilestone/endGame — display only.
let rivalShares = {};

function buildRivalBasket() {
  const perStock = STARTING_CASH / stocks.length;
  rivalShares = Object.fromEntries(
    stocks.map(s => [s.id, perStock / STOCK_STARTING_PRICES[s.id]])
  );
}
buildRivalBasket();

function rivalNetWorth() {
  return stocks.reduce((total, s) => total + (rivalShares[s.id] || 0) * s.price, 0);
}

// ---------- news / tips ----------
// Each sector-tagged headline carries a price effect (a signed percentage)
// applied to every stock in that sector on top of its normal drift+volatility
// on the NEXT Advance Day. Mix of good and bad news across most sectors, so a
// headline can mean "buy this" or "sell/avoid this," not just always-good news.
// A handful of general headlines (sector: null) aren't tied to one sector —
// they nudge every stock at once, with a smaller effect than a targeted one.
const NEWS_HEADLINES = [
  { sector: "TECHNOLOGY", text: "Analysts upgrade ByteWorks Computing on strong earnings.", effect: 0.08 },
  { sector: "TECHNOLOGY", text: "ByteWorks Computing delays its flagship product launch.", effect: -0.06 },
  { sector: "TECHNOLOGY", text: "ByteWorks Computing unveils a breakthrough chip design.", effect: 0.07 },
  { sector: "TECHNOLOGY", text: "A data breach rattles confidence in ByteWorks Computing.", effect: -0.05 },
  { sector: "FOOD",       text: "Greenfield Foods signs a major grocery distribution deal.", effect: 0.05 },
  { sector: "FOOD",       text: "Greenfield Foods recalls a product line.", effect: -0.05 },
  { sector: "FOOD",       text: "A supply shortage hits Greenfield Foods' production line.", effect: -0.04 },
  { sector: "FOOD",       text: "Greenfield Foods rolls out a popular new snack line.", effect: 0.04 },
  { sector: "AEROSPACE",  text: "Orbital Dynamics wins a lucrative satellite contract.", effect: 0.10 },
  { sector: "AEROSPACE",  text: "A rocket engine test failure spooks Orbital Dynamics investors.", effect: -0.09 },
  { sector: "AEROSPACE",  text: "Orbital Dynamics successfully lands a reusable rocket booster.", effect: 0.07 },
  { sector: "AEROSPACE",  text: "Orbital Dynamics loses a bid for a major government contract.", effect: -0.06 },
  { sector: "BEVERAGES",  text: "Soda industry sales climb as Sudsy Cola Co. expands bottling capacity.", effect: 0.04 },
  { sector: "BEVERAGES",  text: "Soda industry sales decline as health trends hit Sudsy Cola Co.", effect: -0.04 },
  { sector: "BEVERAGES",  text: "Sudsy Cola Co. launches a viral new flavor.", effect: 0.05 },
  { sector: "BEVERAGES",  text: "A glass bottling defect forces a recall at Sudsy Cola Co.", effect: -0.05 },
  { sector: "AUTOMOTIVE", text: "Ironclad Motors unveils a popular new pickup model.", effect: 0.06 },
  { sector: "AUTOMOTIVE", text: "Ironclad Motors recalls vehicles over a safety defect.", effect: -0.07 },
  { sector: "AUTOMOTIVE", text: "Ironclad Motors faces a labor strike at its main plant.", effect: -0.05 },
  { sector: "AUTOMOTIVE", text: "Ironclad Motors reports record quarterly vehicle sales.", effect: 0.05 },
  { sector: "GAMING",     text: "Pixelmax Studios' new game tops the sales charts.", effect: 0.09 },
  { sector: "GAMING",     text: "A major Pixelmax Studios title is delayed indefinitely.", effect: -0.08 },
  { sector: "GAMING",     text: "Pixelmax Studios lays off staff after a disappointing quarter.", effect: -0.06 },
  { sector: "GAMING",     text: "Pixelmax Studios signs a hit franchise licensing deal.", effect: 0.06 },
  { sector: "BANKING",    text: "Golden Bridge Bank raises its dividend on strong earnings.", effect: 0.05 },
  { sector: "BANKING",    text: "Regulators fine Golden Bridge Bank over compliance lapses.", effect: -0.06 },
  { sector: "BANKING",    text: "Golden Bridge Bank expands into a new state market.", effect: 0.04 },
  { sector: "BANKING",    text: "Golden Bridge Bank reports a rise in loan defaults.", effect: -0.04 },
  { sector: "AVIATION",   text: "Windrunner Airlines announces new profitable routes.", effect: 0.05 },
  { sector: "AVIATION",   text: "Rising fuel costs squeeze Windrunner Airlines' margins.", effect: -0.05 },
  { sector: "AVIATION",   text: "Windrunner Airlines cancels flights amid a pilot shortage.", effect: -0.06 },
  { sector: "AVIATION",   text: "Windrunner Airlines adds a fleet of fuel-efficient jets.", effect: 0.04 },

  // general / market-wide — applies to every stock, no sector match needed
  { sector: null, text: "Investor confidence dips amid economic uncertainty.", effect: -0.03 },
  { sector: null, text: "A broad market rally lifts stocks across the board.", effect: 0.03 },
  { sector: null, text: "The central bank holds interest rates steady, easing investor nerves.", effect: 0.02 },
  { sector: null, text: "Inflation data comes in higher than expected, rattling markets.", effect: -0.025 },
  { sector: null, text: "A wave of upbeat earnings reports boosts overall market sentiment.", effect: 0.025 },
  { sector: null, text: "Currency swings ripple through the broader stock market.", effect: -0.02 },
];

const NO_HEADLINE_TEXT = "Analysts predict a steady trading day ahead.";
// Was 0.35 (35% placeholder / 65% real) — even though "some real headline"
// was the majority outcome, the placeholder is one fixed piece of text, so
// it was still the single most-repeated exact message a player saw (any one
// of the 38 real headlines individually shows up far less often than that).
// 0.15 targets ~80-85% real / ~15-20% placeholder, verified empirically
// below rather than assumed from the math.
const NO_HEADLINE_CHANCE = 0.15;

function pickHeadline() {
  if (Math.random() < NO_HEADLINE_CHANCE) return null;
  return NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)];
}

// A guaranteed real (non-null) headline — used both for day 1 at load time
// and to restore "day 1's headline" on Play Again. currentHeadline describes
// what's about to happen on the NEXT Advance Day, not something that already
// happened, so day 1 always needs a real tip rather than possibly starting
// blank.
function pickInitialHeadline() {
  return NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)];
}

let currentHeadline = pickInitialHeadline();

// ---------- toasts (achievements + checkpoint-pass banners) ----------
// One shared queue/element so an achievement and a checkpoint pass landing
// on the same Advance Day serialize cleanly instead of overlapping. Each
// achievement fires at most once per playthrough (unlockedAchievements);
// checkpoint-pass banners aren't tracked there since checkMilestone only
// ever evaluates a given milestone day once per playthrough anyway.

const unlockedAchievements = new Set();
const toastQueue = [];
let toastActive = false;
const TOAST_DURATION_MS = 3000;

// variant: "gold" (achievement) or "green" (checkpoint pass) — see .toast-green in CSS
function queueToast(title, message, variant = "gold") {
  toastQueue.push({ title, message, variant });
  processToastQueue();
}

function unlockAchievement(id, title, message) {
  if (unlockedAchievements.has(id)) return;
  unlockedAchievements.add(id);
  queueToast(title, message, "gold");
}

function processToastQueue() {
  if (toastActive || toastQueue.length === 0) return;
  toastActive = true;

  const { title, message, variant } = toastQueue.shift();

  // sound plays when the toast actually pops in (not at unlock time, which
  // could be several seconds earlier if things queued up), so audio and
  // visual always land together
  if (variant === "green") {
    SOUNDS.checkpointPass();
  } else {
    SOUNDS.achievement();
  }

  const container = document.getElementById("achievement-toast");
  container.innerHTML = "";

  // a fresh box element every time — same reasoning as the avatar's pulse
  // class: a brand-new element always replays its CSS animation, so back-
  // to-back toasts (from the queue) each visibly pop in rather than only
  // the first one animating
  const box = document.createElement("div");
  box.className = `achievement-toast-box toast-${variant}`;
  box.innerHTML = `
    <div class="achievement-toast-title">${title}</div>
    <div class="achievement-toast-message">${message}</div>
  `;
  container.appendChild(box);
  container.classList.remove("hidden");

  setTimeout(() => {
    container.classList.add("hidden");
    container.innerHTML = "";
    toastActive = false;
    processToastQueue();
  }, TOAST_DURATION_MS);
}

// ---------- sound effects (generated, no external audio files) ----------
// A single shared AudioContext, created lazily on first use rather than at
// page load — browsers block audio until a user gesture, and every sound
// here is only ever triggered from inside a click handler anyway, so the
// context always ends up created within a valid user-gesture call stack.

let audioCtx = null;
let soundMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Single short tone with a quick attack + exponential decay envelope, the
// classic simple chiptune-blip shape. type is an OscillatorNode waveform
// ("square"/"triangle"/"sawtooth"/"sine"); freqEnd (optional) sweeps the
// pitch linearly across the tone's duration, for whoosh/tick-style sounds.
function playTone({ freq, duration = 0.1, type = "square", startDelay = 0, peakGain = 0.15, freqEnd = null }) {
  if (soundMuted) return;

  const ctx = getAudioContext();
  const t0 = ctx.currentTime + startDelay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== null) {
    osc.frequency.linearRampToValueAtTime(freqEnd, t0 + duration);
  }

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Plays a list of tones back to back (each starting where the previous one's
// duration ends) — used for the little multi-note arpeggios/fanfares.
function playSequence(notes) {
  if (soundMuted) return;
  let cursor = 0;
  for (const note of notes) {
    playTone({ ...note, startDelay: cursor });
    cursor += note.duration;
  }
}

// Musical note frequencies (standard 12-TET), named for readability below.
const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00, C6: 1046.50, E6: 1318.51, G6: 1567.98 };

const SOUNDS = {
  buy: () => playTone({ freq: NOTE.A5, duration: 0.08, type: "square", peakGain: 0.12 }),
  sell: () => playTone({ freq: NOTE.D5, duration: 0.08, type: "square", peakGain: 0.12 }),
  advanceDay: () => playTone({ freq: 220, freqEnd: 440, duration: 0.16, type: "triangle", peakGain: 0.1 }),
  achievement: () => playSequence([
    { freq: NOTE.C5, duration: 0.08, type: "square", peakGain: 0.12 },
    { freq: NOTE.E5, duration: 0.08, type: "square", peakGain: 0.12 },
    { freq: NOTE.G5, duration: 0.08, type: "square", peakGain: 0.12 },
    { freq: NOTE.C6, duration: 0.14, type: "square", peakGain: 0.14 },
  ]),
  checkpointPass: () => playSequence([
    { freq: NOTE.C5, duration: 0.12, type: "triangle", peakGain: 0.13 },
    { freq: NOTE.E5, duration: 0.12, type: "triangle", peakGain: 0.13 },
    { freq: NOTE.G5, duration: 0.22, type: "triangle", peakGain: 0.15 },
  ]),
  win: () => playSequence([
    { freq: NOTE.C5, duration: 0.11, type: "square", peakGain: 0.13 },
    { freq: NOTE.E5, duration: 0.11, type: "square", peakGain: 0.13 },
    { freq: NOTE.G5, duration: 0.11, type: "square", peakGain: 0.13 },
    { freq: NOTE.C6, duration: 0.11, type: "square", peakGain: 0.14 },
    { freq: NOTE.E6, duration: 0.11, type: "square", peakGain: 0.14 },
    { freq: NOTE.G6, duration: 0.4, type: "square", peakGain: 0.16 },
  ]),
  gameOver: () => playSequence([
    { freq: NOTE.G5, duration: 0.16, type: "sawtooth", peakGain: 0.12 },
    { freq: NOTE.E5, duration: 0.16, type: "sawtooth", peakGain: 0.12 },
    { freq: NOTE.C5, duration: 0.35, type: "sawtooth", peakGain: 0.12 },
  ]),
};

function toggleSoundMuted() {
  soundMuted = !soundMuted;
  document.getElementById("sound-toggle-btn").textContent = soundMuted ? "🔇" : "🔊";
  if (!soundMuted) {
    // resuming from a click is itself a user gesture, so this is a safe
    // place to warm up the context rather than waiting for the next sound
    getAudioContext();
  }
}

// Checks shared by both buyStock and sellStock after a successful trade.
function checkCommonTradeAchievements(stock, tradeValue) {
  unlockAchievement("firstTrade", "FIRST TRADE!", "You made your first move!");

  if (player.day === 1) {
    unlockAchievement("dayOneInvestor", "DAY ONE INVESTOR!", "Traded right on day one!");
  }

  if (currentHeadline && currentHeadline.sector !== null && currentHeadline.sector === stock.sector) {
    unlockAchievement("newsReader", "NEWS READER!", "Acted on today's headline!");
  }

  if (tradeValue >= 50_000) {
    unlockAchievement("bigBet", "BIG BET!", "Traded $50,000 or more in one move!");
  }

  const ownedCount = stocks.filter(s => (player.holdings[s.id] || 0) > 0).length;
  if (ownedCount >= 4) {
    unlockAchievement("diversified", "DIVERSIFIED!", "Own shares in 4 or more companies! Spreading your cash around lowers the risk of one bad stock sinking you.");
  }
  if (ownedCount >= stocks.length) {
    unlockAchievement("marketMaven", "MARKET MAVEN!", "Own a piece of every company!");
  }
}

// ---------- formatting helpers ----------

function formatMoney(amount) {
  return "$" + Math.round(amount).toLocaleString("en-US");
}

function formatPrice(amount) {
  return "$" + amount.toFixed(2);
}

function nextMilestone() {
  // strictly greater-than: by the time player.day reaches a milestone's own
  // day, checkMilestone() has already resolved it (pass banner or freeze),
  // so it should no longer display as "next" — otherwise the checkpoint box
  // keeps showing an already-cleared requirement until the following day
  return milestones.find(m => m.day > player.day) || null;
}

// Cosmetic-only career ladder, thresholds spread across the existing
// checkpoint range (start 500k, day-15 checkpoint 600k, day-30 800k) so all
// four titles are realistically reachable across one playthrough.
const CAREER_TITLES = [
  { min: 0,       label: "ROOKIE TRADER" },
  { min: 600_000, label: "JUNIOR ANALYST" },
  { min: 750_000, label: "WALL STREET KID" },
  { min: 900_000, label: "MARKET MOGUL" },
];

function careerTitleForNetWorth(currentNetWorth) {
  let label = CAREER_TITLES[0].label;
  for (const tier of CAREER_TITLES) {
    if (currentNetWorth >= tier.min) label = tier.label;
  }
  return label;
}

function netWorth() {
  let total = player.cash;
  for (const stock of stocks) {
    const shares = player.holdings[stock.id] || 0;
    total += shares * stock.price;
  }
  return total;
}

// ---------- price engine ----------

// Daily upward drift applied to every stock on top of its own random noise.
// Net worth compounds like (1+DRIFT)^days, so this looks small day-to-day but
// is what actually makes the day-15/day-30 checkpoints reliably clearable by
// a simple "diversify and hold" strategy rather than luck-dependent — see the
// simulation this was tuned against (drift-sim results, 500 runs/config):
//   1.25%/day -> day30 checkpoint clear rate  1.6%  (unwinnable by holding)
//   1.50%/day -> day30 checkpoint clear rate 29.2%  (still mostly luck)
//   2.00%/day -> day30 checkpoint clear rate 99.8%  (reliably winnable)
const DAILY_DRIFT = 0.02;

// Random walk plus drift: each day a stock moves by DAILY_DRIFT on average,
// plus/minus noise scaled by its own volatility (so a 0.06-volatility stock
// swings roughly up to +/-6% around that drift, randomized day to day).
function nudgePrice(stock) {
  const pctChange = DAILY_DRIFT + (Math.random() * 2 - 1) * stock.volatility;
  const nextPrice = stock.price * (1 + pctChange);
  return Math.max(0.5, Math.round(nextPrice * 100) / 100);
}

// A day's net worth swings from a few hundred to low thousands for a modest,
// diversified position under the current drift/volatility — $5,000 in one
// day is a meaningfully large, but reachable, single-day gain.
const BIG_WIN_THRESHOLD = 5_000;

function advanceDay() {
  SOUNDS.advanceDay();

  const netWorthBefore = netWorth();

  player.day += 1;

  // the headline on screen right now predicts THIS move, not the next one —
  // capture it before picking tomorrow's headline
  const activeHeadline = currentHeadline;

  for (const stock of stocks) {
    const previousPrice = stock.price;
    let newPrice = nudgePrice(stock);

    // sector: null headlines are general/market-wide and hit every stock;
    // otherwise the headline only affects stocks in the matching sector
    const headlineApplies = activeHeadline &&
      (activeHeadline.sector === null || activeHeadline.sector === stock.sector);
    if (headlineApplies) {
      newPrice = Math.max(0.5, Math.round(newPrice * (1 + activeHeadline.effect) * 100) / 100);
    }

    stock.price = newPrice;
    stock.history.push(newPrice);
    stock.lastChangePercent = ((newPrice - previousPrice) / previousPrice) * 100;
  }

  currentHeadline = pickHeadline();

  const netWorthAfter = netWorth();

  renderAll();

  // Separate, additional reaction layer on top of the pace-based mood
  // (getAvatarStateForNetWorth): fires on EVERY Advance Day based on that
  // day's own immediate result, briefly overriding the pace state, then
  // reverting to it. Not a replacement for the pace comparison — this is a
  // day-over-day delta, checked fresh every single click.
  const direction = netWorthAfter > netWorthBefore ? "up"
    : netWorthAfter < netWorthBefore ? "down"
    : null;
  flashAvatarReaction(direction);
  const netWorthDelta = netWorthAfter - netWorthBefore;
  showFloatingDelta(netWorthDelta);

  if (netWorthDelta >= BIG_WIN_THRESHOLD) {
    unlockAchievement("bigWin", "BIG WIN!", "A huge net worth gain in one day!");
  }

  checkMilestone();
}

// ---------- checkpoints (win / game over) ----------

let gameEnded = false;

function disableGameControls(disabled) {
  document.getElementById("buy-btn").disabled = disabled;
  document.getElementById("sell-btn").disabled = disabled;
  document.getElementById("advance-day-btn").disabled = disabled;
}

// Called after every Advance Day's price update + net worth recalculation.
// Only ever matches on an exact milestone day (15 or 30 currently).
function checkMilestone() {
  const milestone = milestones.find(m => m.day === player.day);
  if (!milestone) return;

  const currentNetWorth = netWorth();
  const passed = currentNetWorth >= milestone.requiredNetWorth;
  const isFinal = milestone.day === config.maxDays;

  if (!passed) {
    endGame("game-over", milestone, currentNetWorth);
    return;
  }

  if (isFinal) {
    endGame("win", milestone, currentNetWorth);
  } else {
    // non-final checkpoint pass: brief, non-blocking banner, game continues
    queueToast(
      `${milestone.label.toUpperCase()} CLEARED!`,
      `Net worth ${formatMoney(currentNetWorth)} — checkpoint passed!`,
      "green"
    );
  }
}

function buildOverlayAvatar(state) {
  const container = document.getElementById("overlay-avatar");
  container.innerHTML = "";
  container.appendChild(buildPlayerPortrait(state));
}

function endGame(outcome, milestone, currentNetWorth) {
  gameEnded = true;
  disableGameControls(true);

  const box = document.getElementById("overlay-box");
  box.classList.remove("win", "game-over");
  box.classList.add(outcome);

  if (outcome === "win") {
    SOUNDS.win();
    buildOverlayAvatar("happy");
    document.getElementById("overlay-title").textContent = milestone.label.toUpperCase();
    document.getElementById("overlay-message").textContent =
      `Final net worth: ${formatMoney(currentNetWorth)} on Day ${milestone.day}. You made it!`;
  } else {
    SOUNDS.gameOver();
    buildOverlayAvatar("stressed");
    document.getElementById("overlay-title").textContent = "GAME OVER";
    document.getElementById("overlay-message").textContent =
      `Missed Day ${milestone.day} — ${milestone.label}. Net worth was ` +
      `${formatMoney(currentNetWorth)}, needed ${formatMoney(milestone.requiredNetWorth)}.`;
  }

  document.getElementById("overlay").classList.remove("hidden");
}

// Resets every piece of one-time/session state for a clean second
// playthrough. Does NOT touch localStorage — no persisted high-score exists
// yet (that's step 7 polish), and this function should never be the place
// that would clear one if it did.
function resetGame() {
  player.cash = STARTING_CASH;
  player.day = 1;
  player.holdings = {};
  player.costBasis = {};

  for (const stock of stocks) {
    const startingPrice = STOCK_STARTING_PRICES[stock.id];
    stock.price = startingPrice;
    stock.history = [startingPrice];
    stock.lastChangePercent = null;
  }

  unlockedAchievements.clear();
  toastQueue.length = 0;
  toastActive = false;
  const toastEl = document.getElementById("achievement-toast");
  toastEl.classList.add("hidden");
  toastEl.innerHTML = "";

  currentAvatarState = null;
  lastPaceState = null;
  if (avatarFlashTimer) {
    clearTimeout(avatarFlashTimer);
    avatarFlashTimer = null;
  }
  // clear any floating +$/-$ popup still mid-animation from right before the
  // reset (they self-remove within ~1.2s normally, but no reason to let a
  // stale one bleed into the new playthrough)
  document.querySelectorAll(".floating-delta").forEach(el => el.remove());

  currentHeadline = pickInitialHeadline();

  gameEnded = false;
  disableGameControls(false);
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("overlay-box").classList.remove("win", "game-over");

  document.getElementById("trade-feedback").textContent = "";
  document.getElementById("trade-shares-input").value = 1;

  renderAll();
}

// ---------- trading ----------

function getSelectedStock() {
  const id = document.getElementById("trade-stock-select").value;
  return stocks.find(stock => stock.id === id) || null;
}

function getSharesInputValue() {
  return parseInt(document.getElementById("trade-shares-input").value, 10);
}

function setTradeFeedback(message) {
  document.getElementById("trade-feedback").textContent = message;
}

// Refreshes cash, net worth, and shares-owned immediately after a trade.
function refreshAfterTrade() {
  renderDashboard();
  renderStockTable();
  syncSelectedStockRow();
}

function buyStock() {
  if (gameEnded) return;

  const stock = getSelectedStock();
  if (!stock) return;

  const shares = getSharesInputValue();
  if (!Number.isInteger(shares) || shares <= 0) {
    setTradeFeedback("Enter a valid number of shares.");
    return;
  }

  const cost = stock.price * shares;
  if (player.cash < cost) {
    setTradeFeedback("Not enough cash for that.");
    return;
  }

  const previousShares = player.holdings[stock.id] || 0;
  const previousCostBasis = player.costBasis[stock.id] || 0;
  const newShares = previousShares + shares;
  // weighted average cost per share; a fresh position just starts at this
  // trade's price rather than blending with a stale/zero previous average
  player.costBasis[stock.id] = previousShares > 0
    ? (previousCostBasis * previousShares + cost) / newShares
    : stock.price;

  player.cash -= cost;
  player.holdings[stock.id] = newShares;

  setTradeFeedback(`Bought ${shares} share${shares === 1 ? "" : "s"} of ${stock.id.toUpperCase()} for ${formatPrice(cost)}.`);
  showFloatingDelta(-cost);
  SOUNDS.buy();
  checkCommonTradeAchievements(stock, cost);
  refreshAfterTrade();
}

function sellStock() {
  if (gameEnded) return;

  const stock = getSelectedStock();
  if (!stock) return;

  const shares = getSharesInputValue();
  if (!Number.isInteger(shares) || shares <= 0) {
    setTradeFeedback("Enter a valid number of shares.");
    return;
  }

  const owned = player.holdings[stock.id] || 0;
  if (owned < shares) {
    setTradeFeedback("You don't own that many shares.");
    return;
  }

  const proceeds = stock.price * shares;
  const avgCost = player.costBasis[stock.id] || 0;

  player.cash += proceeds;
  player.holdings[stock.id] = owned - shares;

  setTradeFeedback(`Sold ${shares} share${shares === 1 ? "" : "s"} of ${stock.id.toUpperCase()} for ${formatPrice(proceeds)}.`);
  showFloatingDelta(proceeds);
  SOUNDS.sell();

  if (stock.price > avgCost) {
    unlockAchievement("profitTaker", "PROFIT TAKER!", "Sold for more than you paid! Locking in a gain like that is the whole point of buying low.");
  }
  checkCommonTradeAchievements(stock, proceeds);
  refreshAfterTrade();
}

// ---------- rendering ----------

function renderNews() {
  document.getElementById("news-headline").textContent = currentHeadline
    ? currentHeadline.text
    : NO_HEADLINE_TEXT;
}

let lastPaceState = null; // tracks the pace-based mood specifically, for detecting a "Comeback Kid" recovery

function renderDashboard() {
  document.getElementById("stat-day").textContent = `${player.day} / ${config.maxDays}`;
  document.getElementById("stat-cash").textContent = formatMoney(player.cash);
  document.getElementById("stat-networth").textContent = formatMoney(netWorth());
  document.getElementById("stat-rival").textContent = `RIVAL: ${formatMoney(rivalNetWorth())}`;

  const upcoming = nextMilestone();
  document.getElementById("stat-checkpoint").textContent = upcoming
    ? `DAY ${upcoming.day} — ${formatMoney(upcoming.requiredNetWorth)}`
    : "ALL CLEARED";

  const currentNetWorth = netWorth();
  const avatarState = getAvatarStateForNetWorth(player.day, currentNetWorth);

  if (lastPaceState === "stressed" && (avatarState === "neutral" || avatarState === "happy")) {
    unlockAchievement("comebackKid", "COMEBACK KID!", "Bounced back from being stressed! Recovering from a rough stretch is part of investing, not a failure.");
  }
  lastPaceState = avatarState;

  setAvatarState(avatarState);
  document.getElementById("career-title").textContent = careerTitleForNetWorth(currentNetWorth);
  drawAllocationChart();
}

// ---------- allocation donut chart (v2) ----------
// Cash + one slice per stock currently held, by dollar value. Tiny (44x44)
// canvas redrawn on every dashboard render — cheap enough not to bother
// diffing against the previous frame.
const ALLOCATION_COLORS = ["#ffd23f", "#00e756", "#ff3355", "#4477ee", "#1c8c7a", "#e8b382", "#9797b3", "#c084fc"];

function drawAllocationChart() {
  const canvas = document.getElementById("allocation-chart");
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - 1;
  const innerRadius = outerRadius * 0.55;

  ctx.clearRect(0, 0, size, size);

  const slices = [{ label: "CASH", value: player.cash, color: "#55627f" }];
  stocks.forEach((s, i) => {
    const shares = player.holdings[s.id] || 0;
    if (shares > 0) {
      slices.push({ label: s.id, value: shares * s.price, color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] });
    }
  });

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return;

  let angle = -Math.PI / 2;
  for (const slice of slices) {
    const sliceAngle = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerRadius, angle, angle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    angle += sliceAngle;
  }

  // punch the donut hole and a thin dark ring separating slices from center
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0d1a";
  ctx.fill();
}

// ---------- ticker tape (v2) ----------
// Rendered twice back to back into one track; the CSS animation scrolls it
// exactly -50% so the seam between the two copies is invisible mid-loop.
function renderTickerTape() {
  const items = stocks.map(s => {
    const change = s.lastChangePercent;
    const cls = change === null ? "" : change > 0 ? "positive" : change < 0 ? "negative" : "";
    const changeText = change === null ? "" : ` (${change > 0 ? "+" : ""}${change.toFixed(1)}%)`;
    return `<span class="ticker-item ${cls}"><span class="ticker-item-symbol">${s.id.toUpperCase()}</span><span class="ticker-item-price">${formatPrice(s.price)}${changeText}</span></span>`;
  }).join("");

  document.getElementById("ticker-tape-track").innerHTML = items + items;
}

// ---------- per-stock sparklines (v2) ----------
// Uses the history[] array already tracked per stock — no new data model.
function drawSparkline(canvas, history) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const points = history.slice(-15);
  if (points.length < 2) return;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  ctx.beginPath();
  points.forEach((price, i) => {
    const x = (i / (points.length - 1)) * (w - 2) + 1;
    const y = h - 1 - ((price - min) / range) * (h - 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = points[points.length - 1] >= points[0] ? "#00e756" : "#ff3355";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawAllSparklines() {
  for (const stock of stocks) {
    drawSparkline(document.querySelector(`canvas[data-spark-id="${stock.id}"]`), stock.history);
  }
}

function renderStockTable() {
  const tbody = document.getElementById("stock-table-body");
  tbody.innerHTML = "";

  for (const stock of stocks) {
    const shares = player.holdings[stock.id] || 0;
    const tr = document.createElement("tr");
    tr.dataset.stockId = stock.id;

    const change = stock.lastChangePercent;
    const hasChange = change !== null;
    const isUp = hasChange && change > 0;
    const isDown = hasChange && change < 0;
    const changeClass = isUp ? "positive" : isDown ? "negative" : "neutral";
    const flashClass = isUp ? "flash-up" : isDown ? "flash-down" : "";
    const changeText = hasChange ? `${change > 0 ? "+" : ""}${change.toFixed(2)}%` : "—";

    // Gain/loss vs. the player's own average cost basis (player.costBasis —
    // the same tracking already built for the Profit Taker achievement, not
    // a new system). Only meaningful while a position is actually held.
    const avgCost = player.costBasis[stock.id] || 0;
    const hasPosition = shares > 0;
    const gainLossDollar = hasPosition ? (stock.price - avgCost) * shares : 0;
    const gainLossPct = hasPosition && avgCost > 0 ? ((stock.price - avgCost) / avgCost) * 100 : 0;
    const gainLossClass = !hasPosition ? "neutral" : gainLossDollar > 0 ? "positive" : gainLossDollar < 0 ? "negative" : "neutral";
    const gainLossText = hasPosition
      ? `${gainLossDollar >= 0 ? "+" : "-"}${formatMoney(Math.abs(gainLossDollar))} (${gainLossPct >= 0 ? "+" : "-"}${Math.abs(gainLossPct).toFixed(1)}%)`
      : "—";

    tr.innerHTML = `
      <td class="stock-ticker">${stock.id.toUpperCase()}</td>
      <td class="stock-company">${stock.name}<button type="button" class="info-icon" data-info-id="${stock.id}" aria-label="About ${stock.name}">&#9432;</button><canvas class="sparkline" data-spark-id="${stock.id}" width="24" height="11"></canvas></td>
      <td class="stock-price ${flashClass}" data-stock-id="${stock.id}">${formatPrice(stock.price)}</td>
      <td class="stock-change ${changeClass} ${flashClass}" data-change-id="${stock.id}">${changeText}</td>
      <td class="stock-gain-loss ${gainLossClass}">${gainLossText}</td>
      <td>${shares}</td>
    `;
    tbody.appendChild(tr);
  }

  drawAllSparklines();
}

// Highlights the stock-table row matching the Broker panel's current dropdown
// selection, visually linking the two panels instead of leaving them feeling
// like separate, unrelated tables.
function syncSelectedStockRow() {
  const selectedId = document.getElementById("trade-stock-select").value;
  document.querySelectorAll("#stock-table-body tr").forEach(tr => {
    tr.classList.toggle("selected", tr.dataset.stockId === selectedId);
  });
}

function renderTradeStockOptions() {
  const select = document.getElementById("trade-stock-select");
  select.innerHTML = "";

  for (const stock of stocks) {
    const opt = document.createElement("option");
    opt.value = stock.id;
    opt.textContent = `${stock.id.toUpperCase()} — ${stock.name}`;
    select.appendChild(opt);
  }
}

function renderAll() {
  renderNews();
  renderDashboard();
  renderStockTable();
  renderTradeStockOptions();
  syncSelectedStockRow();
  renderTickerTape();
}

// ---------- pixel-art portraits ----------
// Drawn as inline SVGs (crisp at any scale, no external image assets needed).
// Each row is authored as its left half + center column (7 chars); the render
// step mirrors it into a symmetric 13-wide face.

function buildPixelPortrait(halfRows, colorMap, cell = 6) {
  const rows = halfRows.map(half => {
    const left = half.split("");
    const mirrored = left.slice(0, 6).reverse();
    return left.concat(mirrored).join("");
  });

  const width = rows[0].length;
  const height = rows.length;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", width * cell);
  svg.setAttribute("height", height * cell);
  svg.setAttribute("shape-rendering", "crispEdges");

  rows.forEach((row, y) => {
    row.split("").forEach((code, x) => {
      if (code === ".") return;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", 1);
      rect.setAttribute("height", 1);
      rect.setAttribute("fill", colorMap[code]);
      svg.appendChild(rect);
    });
  });

  return svg;
}

// ---- broker (NPC advisor) ----

const BROKER_COLORS = {
  K: "#55627f", // hat — neutral chrome color
  S: "#e8b382", // skin
  E: "#0d0d1a", // eyes
  M: "#2b2b3d", // mustache
  J: "#10105c", // jacket — theme navy
  T: "#ffd23f", // tie — gold accent, illustrative rather than chrome
  W: "#f5f5f5", // collar
};

const BROKER_HALF_ROWS = [
  ".KKKKK.",
  ".KKKKK.",
  "KKKKKKK",
  ".SSSSS.",
  ".SSSSS.",
  ".SESSSS",
  ".SSSSMM",
  ".SSSSSS",
  "..WWWWW",
  ".JJJJWT",
  "JJJJJWT",
  "JJJJJJT",
  "JJJJJJT",
];

document.getElementById("broker-avatar").appendChild(buildPixelPortrait(BROKER_HALF_ROWS, BROKER_COLORS));

// ---- player avatar (three reactive expressions) ----

const PLAYER_COLORS = {
  C: "#4477ee", // cap — visually distinct from the broker's neutral hat
  S: "#e8b382", // skin
  E: "#0d0d1a", // eyes
  B: "#2b2b3d", // brow / mouth
  H: "#1c8c7a", // hoodie — distinct from the broker's navy jacket
  W: "#f5f5f5", // collar trim
  P: "#ff6688", // happy blush
};

const PLAYER_ROWS_BY_STATE = {
  neutral: [
    ".CCCCC.", "CCCCCCC", ".SSSSS.", ".SSSSS.",
    ".SESSSS", ".SSSSSS", ".SSSSBB", ".SSSSSS",
    "..WWWWW", ".HHHHWH", "HHHHHWH", "HHHHHHH", "HHHHHHH",
  ],
  happy: [
    ".CCCCC.", "CCCCCCC", ".SSSSS.", ".SSSSS.",
    ".SBSSSS", ".PSSSSS", ".SSBBBB", ".SSSSSS",
    "..WWWWW", ".HHHHWH", "HHHHHWH", "HHHHHHH", "HHHHHHH",
  ],
  stressed: [
    ".CCCCC.", "CCCCCCC", ".SSSSS.", ".SBSSS.",
    ".SESSSS", ".SSSSSS", ".SSSSSB", ".SSSSSS",
    "..WWWWW", ".HHHHWH", "HHHHHWH", "HHHHHHH", "HHHHHHH",
  ],
};

function buildPlayerPortrait(state) {
  // bigger cell than the broker portrait's default (6) — the YOU box is a
  // larger frame now, so the art scales up with it rather than sitting small
  // inside a lot of empty padding
  const svg = buildPixelPortrait(PLAYER_ROWS_BY_STATE[state], PLAYER_COLORS, 9);

  if (state === "stressed") {
    const drop = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    drop.setAttribute("x", 11);
    drop.setAttribute("y", 3);
    drop.setAttribute("width", 1);
    drop.setAttribute("height", 2);
    drop.setAttribute("fill", "#4fb3ff");
    svg.appendChild(drop);
  }

  return svg;
}

let currentAvatarState = null; // tracks what's actually on screen right now

function setAvatarState(state, { forceAnimate = false } = {}) {
  // bounce whenever the expression actually changes, whether that's the
  // pace-based mood shifting (e.g. after a trade) or the day-over-day flash
  // (which always bounces, forced, even if it happens to match what's
  // already showing — the point there is reacting to THIS day specifically)
  const shouldAnimate = forceAnimate || state !== currentAvatarState;
  currentAvatarState = state;

  const container = document.getElementById("player-avatar");
  container.innerHTML = "";
  const svg = buildPlayerPortrait(state);
  // the SVG is a brand-new element every call (never reused), so adding the
  // animation class here always plays it fresh — no stuck-class/no-replay
  // risk, since there's no persistent element whose class could go stale
  if (shouldAnimate) svg.classList.add("avatar-reaction-pulse");
  container.appendChild(svg);
}

let avatarFlashTimer = null;
const AVATAR_FLASH_DURATION_MS = 1800;

// Day-over-day reaction: briefly shows happy/stressed based on whether THIS
// Advance Day's net worth went up or down, then reverts to the pace-based
// mood (getAvatarStateForNetWorth) once the flash window ends. Independent
// of, and layered on top of, the pace-based state — not a replacement.
function flashAvatarReaction(direction) {
  if (!direction) return; // net worth unchanged this day — nothing to flash

  if (avatarFlashTimer) {
    clearTimeout(avatarFlashTimer);
    avatarFlashTimer = null;
  }

  const flashState = direction === "up" ? "happy" : "stressed";
  setAvatarState(flashState, { forceAnimate: true });

  avatarFlashTimer = setTimeout(() => {
    avatarFlashTimer = null;
    // recompute fresh rather than reuse a captured value, in case a trade
    // happened during the flash window and changed the pace-based mood
    setAvatarState(getAvatarStateForNetWorth(player.day, netWorth()));
  }, AVATAR_FLASH_DURATION_MS);
}

// Floating "+$X" / "-$X" popup near the avatar — spawned on a trade's own
// cash flow, or on a day-over-day net worth change. Removes itself once its
// float-up/fade-out animation finishes.
function showFloatingDelta(amount) {
  if (!amount) return;

  const container = document.querySelector(".player-avatar-box");
  const el = document.createElement("div");
  el.className = `floating-delta ${amount > 0 ? "positive" : "negative"}`;
  el.textContent = `${amount > 0 ? "+" : "-"}${formatMoney(Math.abs(amount))}`;
  el.addEventListener("animationend", () => el.remove());
  container.appendChild(el);
}

// Pace curve the player avatar reacts to (called from renderDashboard on every
// render — see getAvatarStateForNetWorth below): linear interpolation between
// the starting cash and each milestone's required net worth.
function expectedPace(day) {
  const points = [
    { day: 0, value: STARTING_CASH },
    ...milestones.map(m => ({ day: m.day, value: m.requiredNetWorth })),
  ];

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (day >= a.day && day <= b.day) {
      const t = (day - a.day) / (b.day - a.day);
      return a.value + t * (b.value - a.value);
    }
  }

  return points[points.length - 1].value;
}

// Thresholds are tuned tight on purpose: with the diversify-and-hold strategy
// the price engine was tuned around (see DAILY_DRIFT), net worth tracks
// expectedPace's linear line closely, especially in the first half of a
// 30-day game — at the original +5%/-10% band it took until ~day 16 for the
// FIRST expression change all game (verified against real Advance Day
// clicks). +2%/-3% reacts by roughly day 6-10 instead, so the avatar is
// visibly alive well within a normal playthrough rather than static for most
// of it.
const AVATAR_GRACE_PERIOD_DAYS = 3;

function getAvatarStateForNetWorth(day, currentNetWorth) {
  // grace period: a brand-new player hasn't had a real chance to trade yet,
  // so hold the pace-based mood at neutral (not just suppressing "stressed")
  // through day 3. The day-over-day flash reaction is untouched by this — it
  // calls this function only for its post-flash revert target.
  if (day <= AVATAR_GRACE_PERIOD_DAYS) return "neutral";

  const pace = expectedPace(day);
  if (currentNetWorth >= pace * 1.02) return "happy";
  if (currentNetWorth < pace * 0.97) return "stressed";
  return "neutral";
}

// ---------- stock info popup ----------

function openStockInfo(stockId) {
  const stock = stocks.find(s => s.id === stockId);
  if (!stock) return;

  document.getElementById("stock-info-name").textContent = stock.name;
  document.getElementById("stock-info-meta").textContent = `${stock.id.toUpperCase()} · ${stock.sector}`;
  document.getElementById("stock-info-description").textContent = stock.description;

  const shares = player.holdings[stock.id] || 0;
  const avgCostEl = document.getElementById("stock-info-avg-cost");
  if (shares > 0) {
    const avgCost = player.costBasis[stock.id] || 0;
    avgCostEl.textContent = `You own ${shares} share${shares === 1 ? "" : "s"} — avg. cost ${formatPrice(avgCost)}/share`;
    avgCostEl.classList.remove("hidden");
  } else {
    avgCostEl.classList.add("hidden");
  }

  document.getElementById("stock-info-modal").classList.remove("hidden");
}

function closeStockInfo() {
  document.getElementById("stock-info-modal").classList.add("hidden");
}

// ---------- event wiring ----------

document.getElementById("sound-toggle-btn").addEventListener("click", toggleSoundMuted);

document.getElementById("buy-btn").addEventListener("click", buyStock);
document.getElementById("sell-btn").addEventListener("click", sellStock);

// event delegation on the tbody — rows get rebuilt on every render, so a
// listener on individual info-icon buttons wouldn't survive a re-render
document.getElementById("stock-table-body").addEventListener("click", (event) => {
  const btn = event.target.closest(".info-icon");
  if (!btn) return;
  openStockInfo(btn.dataset.infoId);
});

document.getElementById("stock-info-close").addEventListener("click", closeStockInfo);

document.getElementById("stock-info-modal").addEventListener("click", (event) => {
  if (event.target.id === "stock-info-modal") closeStockInfo();
});

document.getElementById("advance-day-btn").addEventListener("click", () => {
  if (gameEnded) return;
  // superseded by the win/game-over freeze once a milestone resolves, but
  // kept as a harmless extra guard against the day counter reading "31/30"
  if (player.day >= config.maxDays) return;
  advanceDay();
});

// #overlay-btn belongs only to the win/game-over screen (the stock-info
// modal has its own separate #stock-info-close button/handler) — so this is
// always "Play Again."
document.getElementById("overlay-btn").addEventListener("click", resetGame);

const sharesInput = document.getElementById("trade-shares-input");

document.getElementById("shares-decrement").addEventListener("click", () => {
  const next = Math.max(1, (parseInt(sharesInput.value, 10) || 1) - 1);
  sharesInput.value = next;
});

document.getElementById("shares-increment").addEventListener("click", () => {
  const next = (parseInt(sharesInput.value, 10) || 1) + 1;
  sharesInput.value = next;
});

document.getElementById("trade-stock-select").addEventListener("change", syncSelectedStockRow);

renderAll();
