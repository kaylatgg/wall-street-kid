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
  { sector: "FOOD",       text: "Greenfield Foods signs a major grocery distribution deal.", effect: 0.05 },
  { sector: "FOOD",       text: "Greenfield Foods recalls a product line.", effect: -0.05 },
  { sector: "AEROSPACE",  text: "Orbital Dynamics wins a lucrative satellite contract.", effect: 0.10 },
  { sector: "AEROSPACE",  text: "A rocket engine test failure spooks Orbital Dynamics investors.", effect: -0.09 },
  { sector: "BEVERAGES",  text: "Soda industry sales climb as Sudsy Cola Co. expands bottling capacity.", effect: 0.04 },
  { sector: "BEVERAGES",  text: "Soda industry sales decline as health trends hit Sudsy Cola Co.", effect: -0.04 },
  { sector: "AUTOMOTIVE", text: "Ironclad Motors unveils a popular new pickup model.", effect: 0.06 },
  { sector: "AUTOMOTIVE", text: "Ironclad Motors recalls vehicles over a safety defect.", effect: -0.07 },
  { sector: "GAMING",     text: "Pixelmax Studios' new game tops the sales charts.", effect: 0.09 },
  { sector: "GAMING",     text: "A major Pixelmax Studios title is delayed indefinitely.", effect: -0.08 },
  { sector: "BANKING",    text: "Golden Bridge Bank raises its dividend on strong earnings.", effect: 0.05 },
  { sector: "BANKING",    text: "Regulators fine Golden Bridge Bank over compliance lapses.", effect: -0.06 },
  { sector: "AVIATION",   text: "Windrunner Airlines announces new profitable routes.", effect: 0.05 },
  { sector: "AVIATION",   text: "Rising fuel costs squeeze Windrunner Airlines' margins.", effect: -0.05 },

  // general / market-wide — applies to every stock, no sector match needed
  { sector: null, text: "Investor confidence dips amid economic uncertainty.", effect: -0.03 },
  { sector: null, text: "A broad market rally lifts stocks across the board.", effect: 0.03 },
  { sector: null, text: "The central bank holds interest rates steady, easing investor nerves.", effect: 0.02 },
];

const NO_HEADLINE_TEXT = "Analysts predict a steady trading day ahead.";
const NO_HEADLINE_CHANCE = 0.35; // roughly 1 in 3 days has no notable tip

function pickHeadline() {
  if (Math.random() < NO_HEADLINE_CHANCE) return null;
  return NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)];
}

// currentHeadline describes what's about to happen on the NEXT Advance Day,
// not something that already happened — so day 1 needs a real (non-null)
// headline right away, before any click, rather than possibly starting blank.
let currentHeadline = NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)];

// ---------- achievements / celebration toasts ----------
// Each fires at most once per playthrough (tracked in unlockedAchievements).
// Separate system from the checkpoint pass/fail banners (milestone 5) — pure
// game-feel flavor, styled distinctly (gold) from the Market News panel.

const unlockedAchievements = new Set();
const achievementToastQueue = [];
let achievementToastActive = false;

function unlockAchievement(id, title, message) {
  if (unlockedAchievements.has(id)) return;
  unlockedAchievements.add(id);
  achievementToastQueue.push({ title, message });
  processAchievementToastQueue();
}

const ACHIEVEMENT_TOAST_DURATION_MS = 3000;

function processAchievementToastQueue() {
  if (achievementToastActive || achievementToastQueue.length === 0) return;
  achievementToastActive = true;

  const { title, message } = achievementToastQueue.shift();
  const container = document.getElementById("achievement-toast");
  container.innerHTML = "";

  // a fresh box element every time — same reasoning as the avatar's pulse
  // class: a brand-new element always replays its CSS animation, so back-
  // to-back toasts (from the queue) each visibly pop in rather than only
  // the first one animating
  const box = document.createElement("div");
  box.className = "achievement-toast-box";
  box.innerHTML = `
    <div class="achievement-toast-title">${title}</div>
    <div class="achievement-toast-message">${message}</div>
  `;
  container.appendChild(box);
  container.classList.remove("hidden");

  setTimeout(() => {
    container.classList.add("hidden");
    container.innerHTML = "";
    achievementToastActive = false;
    processAchievementToastQueue();
  }, ACHIEVEMENT_TOAST_DURATION_MS);
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
    unlockAchievement("diversified", "DIVERSIFIED!", "Own shares in 4 or more companies!");
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
  return milestones.find(m => m.day >= player.day) || null;
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
  checkCommonTradeAchievements(stock, cost);
  refreshAfterTrade();
}

function sellStock() {
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

  if (stock.price > avgCost) {
    unlockAchievement("profitTaker", "PROFIT TAKER!", "Sold for more than you paid!");
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

  const upcoming = nextMilestone();
  document.getElementById("stat-checkpoint").textContent = upcoming
    ? `DAY ${upcoming.day} — ${formatMoney(upcoming.requiredNetWorth)}`
    : "ALL CLEARED";

  const currentNetWorth = netWorth();
  const pace = expectedPace(player.day);
  const avatarState = getAvatarStateForNetWorth(player.day, currentNetWorth);

  if (lastPaceState === "stressed" && (avatarState === "neutral" || avatarState === "happy")) {
    unlockAchievement("comebackKid", "COMEBACK KID!", "Bounced back from being stressed!");
  }
  lastPaceState = avatarState;

  setAvatarState(avatarState);

  // TEMP DEBUG — remove once avatar-reactivity issue is confirmed fixed
  document.getElementById("debug-line").textContent =
    `STATE: ${avatarState} | PACE: ${formatMoney(pace)} | NET WORTH: ${formatMoney(currentNetWorth)}`;
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

    tr.innerHTML = `
      <td class="stock-ticker">${stock.id.toUpperCase()}</td>
      <td class="stock-company">${stock.name}<button type="button" class="info-icon" data-info-id="${stock.id}" aria-label="About ${stock.name}">&#9432;</button></td>
      <td class="stock-price ${flashClass}" data-stock-id="${stock.id}">${formatPrice(stock.price)}</td>
      <td class="stock-change ${changeClass} ${flashClass}" data-change-id="${stock.id}">${changeText}</td>
      <td>${shares}</td>
    `;
    tbody.appendChild(tr);
  }
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
  document.getElementById("stock-info-modal").classList.remove("hidden");
}

function closeStockInfo() {
  document.getElementById("stock-info-modal").classList.add("hidden");
}

// ---------- event wiring ----------

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
  // milestone/win/loss checks land in a later step — for now just stop
  // incrementing once the game's day count is exhausted
  if (player.day >= config.maxDays) return;
  advanceDay();
});

document.getElementById("overlay-btn").addEventListener("click", () => {
  document.getElementById("overlay").classList.add("hidden");
});

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
