// ===== Wall Street Kid — Step 1: static UI shell =====
// Placeholder data model only. Advance Day / Buy / Sell logic comes in later steps.

const STARTING_CASH = 500_000;

const player = {
  cash: STARTING_CASH,
  day: 1,
  holdings: {}, // { stockId: shares }
};

const stocks = [
  { id: "byte",  name: "ByteWorks Computing", price: 42.50,  volatility: 0.04, history: [42.50], lastChangePercent: null },
  { id: "grn",   name: "Greenfield Foods",    price: 18.25,  volatility: 0.02, history: [18.25], lastChangePercent: null },
  { id: "orb",   name: "Orbital Dynamics",    price: 96.00,  volatility: 0.07, history: [96.00], lastChangePercent: null },
  { id: "sud",   name: "Sudsy Cola Co.",      price: 12.75,  volatility: 0.015, history: [12.75], lastChangePercent: null },
  { id: "iron",  name: "Ironclad Motors",     price: 61.10,  volatility: 0.03, history: [61.10], lastChangePercent: null },
  { id: "pix",   name: "Pixelmax Studios",    price: 27.90,  volatility: 0.06, history: [27.90], lastChangePercent: null },
  { id: "gld",   name: "Golden Bridge Bank",  price: 108.40, volatility: 0.025, history: [108.40], lastChangePercent: null },
  { id: "wnd",   name: "Windrunner Airlines", price: 34.60,  volatility: 0.05, history: [34.60], lastChangePercent: null },
];

const milestones = [
  { day: 15, requiredNetWorth: 600_000, label: "Halfway review" },
  { day: 30, requiredNetWorth: 800_000, label: "Final inheritance claim" },
];

const config = { maxDays: 30 };

// ---------- news / tips ----------
// Each headline names one stock and a price effect (a signed percentage)
// applied to that stock on top of its normal drift+volatility on the NEXT
// Advance Day. Mix of good and bad news across most stocks, so a headline
// can mean "buy this" or "sell/avoid this," not just always-good news.
const NEWS_HEADLINES = [
  { stockId: "byte", text: "Analysts upgrade ByteWorks Computing on strong earnings.", effect: 0.08 },
  { stockId: "byte", text: "ByteWorks Computing delays its flagship product launch.", effect: -0.06 },
  { stockId: "grn",  text: "Greenfield Foods signs a major grocery distribution deal.", effect: 0.05 },
  { stockId: "grn",  text: "Greenfield Foods recalls a product line.", effect: -0.05 },
  { stockId: "orb",  text: "Orbital Dynamics wins a lucrative satellite contract.", effect: 0.10 },
  { stockId: "orb",  text: "A rocket engine test failure spooks Orbital Dynamics investors.", effect: -0.09 },
  { stockId: "sud",  text: "Sudsy Cola Co. announces a new regional bottling plant.", effect: 0.04 },
  { stockId: "sud",  text: "A competitor undercuts Sudsy Cola Co. on price.", effect: -0.04 },
  { stockId: "iron", text: "Ironclad Motors unveils a popular new pickup model.", effect: 0.06 },
  { stockId: "iron", text: "Ironclad Motors recalls vehicles over a safety defect.", effect: -0.07 },
  { stockId: "pix",  text: "Pixelmax Studios' new game tops the sales charts.", effect: 0.09 },
  { stockId: "pix",  text: "A major Pixelmax Studios title is delayed indefinitely.", effect: -0.08 },
  { stockId: "gld",  text: "Golden Bridge Bank raises its dividend on strong earnings.", effect: 0.05 },
  { stockId: "gld",  text: "Regulators fine Golden Bridge Bank over compliance lapses.", effect: -0.06 },
  { stockId: "wnd",  text: "Windrunner Airlines announces new profitable routes.", effect: 0.05 },
  { stockId: "wnd",  text: "Rising fuel costs squeeze Windrunner Airlines' margins.", effect: -0.05 },
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

function advanceDay() {
  player.day += 1;

  // the headline on screen right now predicts THIS move, not the next one —
  // capture it before picking tomorrow's headline
  const activeHeadline = currentHeadline;

  for (const stock of stocks) {
    const previousPrice = stock.price;
    let newPrice = nudgePrice(stock);

    if (activeHeadline && activeHeadline.stockId === stock.id) {
      newPrice = Math.max(0.5, Math.round(newPrice * (1 + activeHeadline.effect) * 100) / 100);
    }

    stock.price = newPrice;
    stock.history.push(newPrice);
    stock.lastChangePercent = ((newPrice - previousPrice) / previousPrice) * 100;
  }

  currentHeadline = pickHeadline();

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

// Refreshes just cash + shares-owned after a trade. Net worth is left as-is
// on purpose — it isn't wired up to react to trades until milestone 4.
function refreshAfterTrade() {
  document.getElementById("stat-cash").textContent = formatMoney(player.cash);
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

  player.cash -= cost;
  player.holdings[stock.id] = (player.holdings[stock.id] || 0) + shares;

  setTradeFeedback(`Bought ${shares} share${shares === 1 ? "" : "s"} of ${stock.id.toUpperCase()} for ${formatPrice(cost)}.`);
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
  player.cash += proceeds;
  player.holdings[stock.id] = owned - shares;

  setTradeFeedback(`Sold ${shares} share${shares === 1 ? "" : "s"} of ${stock.id.toUpperCase()} for ${formatPrice(proceeds)}.`);
  refreshAfterTrade();
}

// ---------- rendering ----------

function renderNews() {
  document.getElementById("news-headline").textContent = currentHeadline
    ? currentHeadline.text
    : NO_HEADLINE_TEXT;
}

function renderDashboard() {
  document.getElementById("stat-day").textContent = `${player.day} / ${config.maxDays}`;
  document.getElementById("stat-cash").textContent = formatMoney(player.cash);
  document.getElementById("stat-networth").textContent = formatMoney(netWorth());

  const upcoming = nextMilestone();
  document.getElementById("stat-checkpoint").textContent = upcoming
    ? `DAY ${upcoming.day} — ${formatMoney(upcoming.requiredNetWorth)}`
    : "ALL CLEARED";
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
      <td class="stock-company">${stock.name}</td>
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

function setAvatarState(state) {
  const container = document.getElementById("player-avatar");
  container.innerHTML = "";
  container.appendChild(buildPlayerPortrait(state));
}

// Future hook: once net worth tracking exists (milestone 4), call
// setAvatarState(getAvatarStateForNetWorth(player.day, netWorth())) after each
// Advance Day. Nothing calls this yet.
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

function getAvatarStateForNetWorth(day, currentNetWorth) {
  const pace = expectedPace(day);
  if (currentNetWorth >= pace * 1.05) return "happy";
  if (currentNetWorth < pace * 0.9) return "stressed";
  return "neutral";
}

setAvatarState("neutral");

// ---------- event wiring ----------

document.getElementById("buy-btn").addEventListener("click", buyStock);
document.getElementById("sell-btn").addEventListener("click", sellStock);

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
