// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://lbyovwbfwbrmbhavbyud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieW92d2Jmd2JybWJoYXZieXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjcyOTgsImV4cCI6MjA5NjUwMzI5OH0.FUIgpKPXZYDlr7QTaMbU7W3IQAx4N0bDCCXnMUdI4IY';
const sbClient     = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let   currentUser  = null;

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL  = 25;
const N_GOLD = 8;

function calcMultStep(m) { return (m / (TOTAL - m)) * 2; }

const RISK = [
  { label: 'Niedrig', color: '#4caf50' },
  { label: 'Mittel',  color: '#ffd700' },
  { label: 'Hoch',    color: '#ff9800' },
  { label: 'Extrem',  color: '#f44336' },
];

const MARKET_NEWS = [
  'Goldmine in Arizona kollabiert – Preise steigen',
  'Zentralbank erhöht Goldreserven stark',
  'Tech-Gigant verkauft Goldbestände – Kurs fällt',
  'Bergbaustreik in Südafrika hält an',
  'Anleger flüchten in Sachwerte – Gold gefragt',
  'Neue Goldvorkommen in Australien entdeckt',
  'Inflation treibt Goldnachfrage an',
  'Hedgefonds bauen Goldpositionen ab',
  'Geopolitische Spannungen stützen Goldpreis',
  'Starker Dollar belastet Goldkurs',
];

// ── Upgrades  (kosten Nuggets, nicht €) ───────────────────────────────────────
const UPGRADES = [
  { id: 'insurance', name: 'Versicherung',  icon: '🛡️', cost: 3,  desc: 'Mine → 50% Einsatz zurück' },
  { id: 'charm',     name: 'Glücksbringer', icon: '🍀', cost: 12, desc: '1 Mine wird zu Gold' },
  { id: 'joker',     name: 'Joker',         icon: '🃏', cost: 18, desc: '1 Mine übersteht – Runde läuft weiter' },
];
// Runden die ein Upgrade nach Benutzung gesperrt bleibt
const UPGRADE_COOLDOWNS = { insurance: 2, charm: 3, joker: 4 };

// ── Event Cards  (kosten Nuggets, nicht €) ────────────────────────────────────
const ALL_EVENTS = [
  { id: 'blind_luck',  name: 'Blindes Glück',  icon: '🎭', cost: 2,  desc: 'Wahrsch. versteckt, +30% Cash-Out',   color: '#9c27b0' },
  { id: 'mine_alarm',  name: 'Minen-Alarm',    icon: '🚨', cost: 3,  desc: '1 Mine wird vorab markiert',           color: '#f44336' },
  { id: 'booster',     name: 'Booster',         icon: '🚀', cost: 4,  desc: 'Start-Multiplikator 1.5× statt 1.0×', color: '#2196f3' },
  { id: 'double_gold', name: 'Doppeltes Gold', icon: '✨', cost: 5,  desc: '+1.0× pro Gold statt +0.5×',          color: '#ffd700' },
  { id: 'extra_gold',  name: 'Extra-Gold',      icon: '💎', cost: 6,  desc: '+2 zusätzliche Goldfelder',            color: '#4caf50' },
  { id: 'jackpot',     name: 'Jackpot',         icon: '🎰', cost: 8,  desc: 'Alle Gold gefunden → ×3 Bonus',        color: '#ff8c00' },
];

// ── Milestones ────────────────────────────────────────────────────────────────
const MILESTONES = [
  { amount: 1000,    label: '€1K',    name: 'Einsteiger',  nuggets: 0   },
  { amount: 2500,    label: '€2,5K',  name: 'Aufsteiger',  nuggets: 8   },
  { amount: 5000,    label: '€5K',    name: 'Profi',        nuggets: 15  },
  { amount: 10000,   label: '€10K',   name: 'Experte',      nuggets: 25  },
  { amount: 25000,   label: '€25K',   name: 'Meister',      nuggets: 40  },
  { amount: 50000,   label: '€50K',   name: 'Legende',      nuggets: 60  },
  { amount: 100000,  label: '€100K',  name: 'Elite',        nuggets: 80  },
  { amount: 250000,  label: '€250K',  name: 'Investor',     nuggets: 120 },
  { amount: 500000,  label: '€500K',  name: 'Mogul',        nuggets: 180 },
  { amount: 1000000,  label: '€1M',   name: 'Millionär',  nuggets: 300  },
  { amount: 2500000,  label: '€2,5M', name: 'Kapitalist', nuggets: 500  },
  { amount: 5000000,  label: '€5M',   name: 'Tycoon',     nuggets: 750  },
  { amount: 10000000,  label: '€10M',   name: 'Magnate',     nuggets: 1000 },
  { amount: 25000000,  label: '€25M',   name: 'Oligarch',    nuggets: 1500 },
  { amount: 50000000,  label: '€50M',   name: 'Milliardär',  nuggets: 2000 },
  { amount: 100000000, label: '€100M',  name: 'Konzernchef', nuggets: 3000 },
  { amount: 500000000, label: '€500M',  name: 'Weltmacht',   nuggets: 5000 },
  { amount: 1000000000,label: '€1B',    name: 'Legende',     nuggets: 10000 },
];
let reachedMilestones = new Set();

function renderMilestone() {
  const pathEl = el('msPath');
  const infoEl = el('msInfo');
  const nameEl = el('msLevelName');
  if (!pathEl) return;

  let level = -1;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (balance >= MILESTONES[i].amount) level = i;
  }

  const nextIdx  = level + 1;
  const hasNext  = nextIdx < MILESTONES.length;
  const fromAmt  = level >= 0 ? MILESTONES[level].amount : 0;
  const toAmt    = hasNext ? MILESTONES[nextIdx].amount : MILESTONES[MILESTONES.length - 1].amount;
  const progress = hasNext
    ? Math.max(0, Math.min(1, (balance - fromAmt) / (toAmt - fromAmt)))
    : 1;

  if (nameEl) nameEl.textContent = level >= 0 ? MILESTONES[level].name : 'Anfänger';

  const center = Math.max(1, Math.min(MILESTONES.length - 2, nextIdx));
  const start  = Math.max(0, center - 2);
  const end    = Math.min(MILESTONES.length - 1, start + 4);
  const slice  = MILESTONES.slice(start, end + 1);

  pathEl.innerHTML = slice.map(function(ms, i) {
    const mIdx   = start + i;
    const done   = balance >= ms.amount;
    const isNext = mIdx === nextIdx;
    const isCurr = mIdx === level;
    var cls = done ? 'done' : '';
    if (isCurr) cls += ' curr';
    if (isNext) cls += ' nxt';
    var line = i < slice.length - 1
      ? '<div class="ms-line ' + (done ? 'done' : '') + '"></div>'
      : '';
    return '<div class="ms-node ' + cls + '"><div class="ms-dot"></div><div class="ms-lbl">' + ms.label + '</div></div>' + line;
  }).join('');

  if (infoEl) {
    if (hasNext) {
      var pct = Math.round(progress * 100);
      var reward = MILESTONES[nextIdx].nuggets > 0
        ? ' <span class="ms-reward">+' + MILESTONES[nextIdx].nuggets + ' 🪙</span>' : '';
      infoEl.innerHTML =
        '<div class="ms-bar"><div class="ms-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="ms-bar-label">→ <strong>' + MILESTONES[nextIdx].name + '</strong>' +
        ' (€' + fmt(toAmt) + ')' + reward + '  <span class="ms-pct">' + pct + '%</span></div>';
    } else {
      infoEl.innerHTML = '<div class="ms-bar-label" style="color:#ffd700;text-align:center">🏆 Maximalstufe erreicht!</div>';
    }
  }
}

function checkMilestoneRewards(silent) {
  MILESTONES.forEach(function(ms, i) {
    if (balance >= ms.amount && !reachedMilestones.has(i)) {
      reachedMilestones.add(i);
      if (!silent && ms.nuggets > 0) {
        goldInventory += ms.nuggets;
        renderInventory();
        showToast('🏆 ' + ms.name + ' erreicht! +' + ms.nuggets + ' 🪙 Nuggets!', '#ffd700');
      }
    }
  });
}

// ── Achievements ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'goldgraeber', name: 'Goldgräber',         icon: '⛏️', reward: 100,
    desc: '50 Nuggets insgesamt gefunden',
    check:    () => stats.nuggetsFound >= 50,
    progress: () => ({ cur: stats.nuggetsFound, max: 50, unit: 'Nuggets' }) },

  { id: 'survivor',   name: 'Überlebenskünstler',  icon: '🛡️', reward: 300,
    desc: '5 Runden in Folge ohne Mine',
    check:    () => streak >= 5,
    progress: () => ({ cur: streak, max: 5, unit: 'Streak' }) },

  { id: 'perfect',    name: 'Perfekte Runde',      icon: '💎', reward: 200,
    desc: 'Alle 8 Goldfelder in einer Runde',
    check:    () => stats.lastRoundAllGold,
    progress: null },

  { id: 'trader',     name: 'Händler',             icon: '📈', reward: 150,
    desc: '30 Nuggets verkauft',
    check:    () => stats.nuggetsSold >= 30,
    progress: () => ({ cur: stats.nuggetsSold, max: 30, unit: 'verkauft' }) },

  { id: 'highroller', name: 'High Roller',         icon: '🎰', reward: 250,
    desc: '€500+ in einer Runde eingesetzt',
    check:    () => stats.maxBet >= 500,
    progress: () => ({ cur: stats.maxBet, max: 500, prefix: '€', unit: 'Einsatz' }) },

  { id: 'lucky',      name: 'Glückspilz',          icon: '🍀', reward: 500,
    desc: 'Bei 5.00× oder höher ausgezahlt',
    check:    () => stats.bestMultiplier >= 5,
    progress: () => ({ cur: stats.bestMultiplier, max: 5, suffix: '×', dec: 2, unit: 'Mult.' }) },

  { id: 'millionaire', name: 'Millionär',          icon: '💰', reward: 1000,
    desc: 'Guthaben €5.000+ erreicht',
    check:    () => balance >= 5000,
    progress: () => ({ cur: balance, max: 5000, prefix: '€', unit: 'Guthaben' }) },
];

// ── Game State ────────────────────────────────────────────────────────────────
let balance       = 1000;
let nMines        = 5;
let bet           = 0;
let multiplier    = 1.0;
let active        = false;
let board         = [];
let revealed      = [];
let warningCells  = new Set();
let minesLeft     = 0;
let hiddenLeft    = 0;
let roundLog      = [];
let streak        = 0;
let jokerUsed     = false;
let roundGoldCount = N_GOLD;

let boughtUpgrades     = new Set();
let boughtUpgradeCosts = {};       // gespeicherter Einkaufspreis für korrekte Rückerstattung
let upgradeCooldowns   = {};       // { id: verbleibende Runden }
let boughtEvents       = new Set();
let drawnCards     = [];
let roundNuggets   = 0;   // Nuggets dieser Runde — nur bei Cashout gutgeschrieben

// Market / Inventory
let goldInventory  = 5;   // 5 Startnuggets damit Upgrades sofort testbar sind
let marketPrice    = 65;
let priceHistory   = [];
let marketTimer    = 120;
let goldRushActive = false;
let lastPrice      = 65;

// Stats
let stats = {
  roundsPlayed: 0, roundsWon: 0, totalProfit: 0,
  biggestWin: 0, bestMultiplier: 0,
  nuggetsFound: 0, nuggetsSold: 0, marketEarned: 0,
  maxBet: 0, lastRoundAllGold: false,
  totalLosses: 0,
  perfectRoundCount: 0,
  maxInventory: 0,
  highRiskCashouts: 0,
  soldDuringRush: false,
};

let unlockedAchievements = new Set();
let activeTab = 'market';

// ── Helpers ───────────────────────────────────────────────────────────────────
const el  = id => document.getElementById(id);
const fmt = n  => Math.round(n).toLocaleString('de-DE');

// Preis-Multiplikator basierend auf aktuellem Milestone-Level
// Level 0-2 (€1K–€5K): ×1 | 3-5 (€10K–€50K): ×2 | 6-8 (€100K–€500K): ×3 | 9+ (€1M+): ×4 ...
function getPriceMultiplier() {
  let level = -1;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (balance >= MILESTONES[i].amount) level = i;
  }
  return 1 + Math.floor(Math.max(0, level) / 3);
}
function getScaledCost(base) { return base * getPriceMultiplier(); }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Adjacency Hint ────────────────────────────────────────────────────────────
function getAdjacentSpecialCount(i) {
  const row = Math.floor(i / 5), col = i % 5;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < 5 && c >= 0 && c < 5 && board[r * 5 + c] !== 'empty') count++;
    }
  }
  return count;
}

function setAdjHint(i) {
  const adj = getAdjacentSpecialCount(i);
  if (adj > 0) {
    el(`fi${i}`).textContent = adj;
    el(`fi${i}`).className   = 'face-icon adj-hint adj-' + (adj <= 2 ? '1' : adj <= 4 ? '2' : adj <= 6 ? '3' : '4');
  } else {
    el(`fi${i}`).textContent = '○';
    el(`fi${i}`).className   = 'face-icon';
  }
}

// ── Grid Builder ──────────────────────────────────────────────────────────────
(function buildGrid() {
  const g = el('grid');
  for (let i = 0; i < TOTAL; i++) {
    const c = document.createElement('div');
    c.className = 'cell';
    c.id = `c${i}`;
    c.innerHTML = `
      <div class="cell-inner">
        <div class="face face-front">
          <div class="prob-pct" id="pp${i}">—</div>
          <div class="prob-lbl">Mine-Wahrsch.</div>
        </div>
        <div class="face face-back" id="fb${i}">
          <span class="face-icon" id="fi${i}"></span>
        </div>
      </div>`;
    c.addEventListener('click', () => clickCell(i));
    g.appendChild(c);
  }
})();

// ── Upgrades  (Nugget-Währung) ────────────────────────────────────────────────
function toggleUpgrade(id) {
  if (active) return;
  const upg = UPGRADES.find(u => u.id === id);
  if (!upg) return;

  // Cooldown-Check
  const cd = upgradeCooldowns[id] || 0;
  if (cd > 0 && !boughtUpgrades.has(id)) {
    showToast('⏳ ' + upg.name + ' — noch ' + cd + ' Runde' + (cd > 1 ? 'n' : '') + ' Cooldown', '#8892b0');
    return;
  }

  const cost = getScaledCost(upg.cost);

  if (boughtUpgrades.has(id)) {
    boughtUpgrades.delete(id);
    const refund = boughtUpgradeCosts[id] || cost;
    delete boughtUpgradeCosts[id];
    goldInventory += refund;
    showToast(upg.icon + ' ' + upg.name + ' deaktiviert  (+' + refund + ' 🪙 zurück)', '#8892b0');
  } else {
    if (goldInventory < cost) {
      showToast('Zu wenig Nuggets — ' + cost + ' 🪙 für ' + upg.name + ' benötigt.', '#f44336');
      return;
    }
    if (id === 'charm' && nMines < 2) {
      showToast('Glücksbringer braucht mindestens 2 Minen!', '#f44336');
      return;
    }
    boughtUpgrades.add(id);
    boughtUpgradeCosts[id] = cost;
    goldInventory -= cost;
    showToast('✓ ' + upg.icon + ' ' + upg.name + ' aktiviert!  (−' + cost + ' 🪙)', '#4caf50');
  }
  renderInventory();
  renderUpgrades();
  renderEventCards();
}

function renderUpgrades() {
  const wrap = el('upgradesWrap');
  if (!wrap) return;
  const mult = getPriceMultiplier();
  const btns = UPGRADES.map(function(u) {
    const bought     = boughtUpgrades.has(u.id);
    const cd         = upgradeCooldowns[u.id] || 0;
    const onCooldown = cd > 0 && !bought;
    const cost       = u.cost * mult;
    const canAfford  = goldInventory >= cost;
    var cls = '';
    if (bought)       cls = 'active';
    else if (onCooldown) cls = 'on-cooldown';
    else if (!canAfford) cls = 'cant-afford';
    var costTxt = bought ? '✓ aktiv' : onCooldown ? '⏳ ' + cd + ' Rdn' : cost + ' 🪙';
    return '<div class="upg-btn ' + cls + '"'
         + ' onclick="toggleUpgrade(\'' + u.id + '\')" title="' + u.desc + '">'
         + '<span class="upg-icon">' + u.icon + '</span>'
         + '<span class="upg-name">' + u.name + '</span>'
         + '<span class="upg-cost">' + costTxt + '</span>'
         + '</div>';
  }).join('');
  const tierHint = mult > 1
    ? '<div class="price-tier-hint">📊 Preisstufe ' + mult + '×</div>'
    : '';
  wrap.innerHTML = btns + tierHint;
}

// ── Event Cards  (Nugget-Währung) ─────────────────────────────────────────────
function drawNewCards() {
  drawnCards = shuffle([...ALL_EVENTS]).slice(0, 3);
  boughtEvents.clear();
  renderEventCards();
}

function buyEventCard(id) {
  if (active || boughtEvents.has(id)) return;
  const card = ALL_EVENTS.find(c => c.id === id);
  if (!card) return;
  const cost = getScaledCost(card.cost);
  if (goldInventory < cost) {
    showToast('Zu wenig Nuggets! ' + cost + ' 🪙 für ' + card.name + ' benötigt.', '#f44336');
    return;
  }
  boughtEvents.add(id);
  goldInventory -= cost;
  showToast('✓ ' + card.icon + ' ' + card.name + ' aktiviert!  (−' + cost + ' 🪙)', '#4caf50');
  renderInventory();
  renderEventCards();
  renderUpgrades();
}

function renderEventCards() {
  const wrap = el('eventCardsWrap');
  if (!wrap) return;
  wrap.innerHTML = drawnCards.map(function(card) {
    const bought    = boughtEvents.has(card.id);
    const cost      = getScaledCost(card.cost);
    const canAfford = goldInventory >= cost;
    return '<div class="event-card ' + (bought ? 'bought' : '') + ' ' + (!canAfford && !bought ? 'cant-afford' : '') + '"'
         + ' style="--card-color:' + card.color + '"'
         + ' onclick="buyEventCard(\'' + card.id + '\')">'
         + '<div class="ec-icon">' + card.icon + '</div>'
         + '<div class="ec-name">' + card.name + '</div>'
         + '<div class="ec-desc">' + card.desc + '</div>'
         + '<div class="ec-cost">' + (bought ? '✓ Aktiv' : cost + ' 🪙') + '</div>'
         + '</div>';
  }).join('');
}

// ── Round Logic ───────────────────────────────────────────────────────────────
function startRound() {
  const raw = parseInt(el('betInput').value, 10);
  if (!raw || raw < 1) { flashStatus('Bitte einen gültigen Einsatz eingeben!', 'loss'); return; }
  if (raw > balance)    { flashStatus('Nicht genug Guthaben!', 'loss'); return; }

  bet        = raw;
  balance   -= bet;
  minesLeft  = nMines;
  hiddenLeft = TOTAL;
  active       = true;
  jokerUsed    = false;
  roundNuggets = 0;
  warningCells.clear();
  renderPending();
  stats.roundsPlayed++;
  stats.maxBet          = Math.max(stats.maxBet, bet);
  stats.lastRoundAllGold = false;

  roundGoldCount = boughtEvents.has('extra_gold') ? N_GOLD + 2 : N_GOLD;
  multiplier     = boughtEvents.has('booster') ? 1.5 : 1.0;

  const pos = shuffle(Array.from({ length: TOTAL }, (_, i) => i));
  board    = Array(TOTAL).fill('empty');
  revealed = Array(TOTAL).fill(false);

  let mineCount = nMines;
  if (boughtUpgrades.has('charm') && mineCount >= 2) mineCount--;
  for (let i = 0; i < mineCount; i++)                              board[pos[i]] = 'mine';
  for (let i = mineCount; i < mineCount + roundGoldCount; i++) board[pos[i]] = 'gold';
  minesLeft = mineCount;

  // Visual reset
  for (let i = 0; i < TOTAL; i++) {
    el(`c${i}`).classList.remove('flipped', 'warned');
    el(`c${i}`).classList.add('clickable');
    el(`fb${i}`).className = 'face face-back';
    el(`fi${i}`).textContent = '';
    el(`fi${i}`).className   = 'face-icon';
    el(`pp${i}`).textContent = '—';
    el(`pp${i}`).style.color = '';
  }

  // Mine Alarm
  if (boughtEvents.has('mine_alarm')) {
    const mines = board.map((t, i) => t === 'mine' ? i : -1).filter(i => i >= 0);
    if (mines.length) {
      const idx = mines[Math.floor(Math.random() * mines.length)];
      warningCells.add(idx);
      el(`c${idx}`).classList.add('warned');
      el(`c${idx}`).classList.remove('clickable');
      el(`pp${idx}`).textContent = '⚠️';
    }
  }

  updateProbs();
  renderBalance();
  renderMultiplier();
  renderWin();
  updateInfoBar();
  setStatus('Viel Glück! Klicke ein Feld.', '');

  el('btnStart').disabled   = true;
  el('btnCashout').disabled = false;
  el('betInput').disabled   = true;
  el('mineSlider').disabled = true;
  el('tab-events').disabled = true;
}

function autoRevealCell(i) {
  if (revealed[i] || board[i] === 'mine') return;
  revealed[i] = true;
  hiddenLeft--;
  el(`c${i}`).classList.add('flipped');
  el(`c${i}`).classList.remove('clickable');
  el(`pp${i}`).textContent = '—';
  if (board[i] === 'gold') {
    el(`fb${i}`).className = 'face face-back is-gold';
    el(`fi${i}`).textContent = '🪙';
    multiplier += calcMultStep(nMines) * (boughtEvents.has('double_gold') ? 2 : 1);
    roundNuggets++;
    stats.nuggetsFound++;
    renderPending();
  } else {
    el(`fb${i}`).className = 'face face-back is-empty';
    el(`fi${i}`).textContent = '○';
  }
}

function clickCell(i) {
  if (!active || revealed[i] || warningCells.has(i)) return;
  revealed[i] = true;
  hiddenLeft--;
  el(`pp${i}`).textContent = '—';
  el(`c${i}`).classList.remove('clickable');
  el(`c${i}`).classList.add('flipped');

  if (board[i] === 'mine') {
    el(`fb${i}`).className = 'face face-back is-mine pulse';
    el(`fi${i}`).textContent = '💣';

    if (boughtUpgrades.has('joker') && !jokerUsed) {
      jokerUsed = true;
      boughtUpgrades.delete('joker');
      minesLeft--;
      el(`fb${i}`).className = 'face face-back is-empty';
      el(`fi${i}`).textContent = '🃏';
      showToast('🃏 Joker eingesetzt! Runde läuft weiter!', '#ff8c00');
      updateProbs();
      updateInfoBar();
      renderUpgrades();
      return;
    }

    setTimeout(() => { revealAll(); endRound('loss', 0); }, 480);

  } else if (board[i] === 'gold') {
    const step = calcMultStep(nMines) * (boughtEvents.has('double_gold') ? 2 : 1);
    multiplier += step;
    roundNuggets++;
    stats.nuggetsFound++;
    el(`fb${i}`).className = 'face face-back is-gold pulse';
    el(`fi${i}`).textContent = '🪙';
    showNuggetFloat(el(`c${i}`));
    renderMultiplier(true);
    renderWin();
    renderPending();
    renderUpgrades();
    renderEventCards();
    updateProbs();
    updateInfoBar();

    const goldLeft = board.filter((t, j) => !revealed[j] && t === 'gold').length;
    if (goldLeft === 0) {
      triggerWinAnimation();
      setTimeout(() => cashOut(), 1600);
    }

  } else {
    el(`fb${i}`).className = 'face face-back is-empty';
    setAdjHint(i);
    updateProbs();
    updateInfoBar();
  }
}

function cashOut() {
  if (!active) return;
  const streakBonus = Math.min(streak, 3) * 0.05;
  let finalMult = multiplier * (1 + streakBonus);
  if (boughtEvents.has('blind_luck')) finalMult *= 1.3;

  const goldFound = board.filter((t, i) => revealed[i] && t === 'gold').length;
  stats.lastRoundAllGold = goldFound === roundGoldCount;
  if (boughtEvents.has('jackpot') && stats.lastRoundAllGold) {
    finalMult *= 3;
    showToast('🎰 JACKPOT! 3× Bonus!', '#ffd700');
  }

  const total = Math.floor(bet * finalMult);
  balance += total;
  goldInventory += roundNuggets;   // Nuggets werden erst jetzt gutgeschrieben
  renderInventory();
  revealAll();
  endRound(roundNuggets > 0 ? 'win' : 'push', total, streakBonus, finalMult);
}

function endRound(result, amount, streakBonus = 0, finalMult = multiplier) {
  // Upgrades merken VOR dem Clear — damit Effekte (Versicherung) noch greifen
  const hadInsurance = boughtUpgrades.has('insurance');

  active = false;
  for (let i = 0; i < TOTAL; i++) el(`c${i}`).classList.remove('clickable');
  el('btnStart').disabled   = false;
  el('btnCashout').disabled = true;
  el('betInput').disabled   = false;
  el('mineSlider').disabled = false;
  el('tab-events').disabled = false;

  // Cooldowns: erst existierende dekrementieren, dann neue für benutzte Upgrades setzen
  Object.keys(upgradeCooldowns).forEach(function(id) {
    if (upgradeCooldowns[id] > 0) upgradeCooldowns[id]--;
  });
  boughtUpgrades.forEach(function(id) {
    if (UPGRADE_COOLDOWNS[id]) upgradeCooldowns[id] = UPGRADE_COOLDOWNS[id];
  });
  boughtUpgradeCosts = {};

  boughtUpgrades.clear();
  drawNewCards();
  renderUpgrades();
  renderBalance();
  renderWin();

  renderPending();   // Pending-Anzeige ausblenden

  if (result === 'win') {
    streak++;
    const profit = amount - bet;
    stats.roundsWon++;
    stats.totalProfit    += profit;
    stats.biggestWin      = Math.max(stats.biggestWin, amount);
    stats.bestMultiplier  = Math.max(stats.bestMultiplier, finalMult);
    if (stats.lastRoundAllGold) stats.perfectRoundCount++;
    if (nMines >= 12) stats.highRiskCashouts++;
    const bonusTxt = streakBonus > 0 ? ` (+${Math.round(streakBonus * 100)}% Streak)` : '';
    setStatus(`Cash Out: €${fmt(amount)}  (+€${fmt(profit)})${bonusTxt}`, 'win');
    addLog(`+€${fmt(profit)}`, `×${finalMult.toFixed(2)}`, 'win');
  } else if (result === 'loss') {
    stats.totalLosses++;
    if (roundNuggets > 0) {
      showToast('💣 Mine! ' + roundNuggets + ' 🪙 Nugget' + (roundNuggets > 1 ? 's' : '') + ' verloren.', '#f44336');
    }
    if (hadInsurance) {
      const refund = Math.floor(bet * 0.5);
      balance += refund;
      stats.totalProfit -= (bet - refund);
      renderBalance();
      showToast(`🛡️ Versicherung: €${fmt(refund)} zurück!`, '#4caf50');
      setStatus(`Mine! −€${fmt(bet - refund)} (Versicherung aktiv)`, 'loss');
    } else {
      stats.totalProfit -= bet;
      setStatus(`Mine! Einsatz verloren: −€${fmt(bet)}`, 'loss');
    }
    streak = 0;
    addLog(`−€${fmt(bet)}`, 'Mine 💣', 'loss');
  } else {
    setStatus('Cashout ohne Nuggets – kein Win gewertet.', '');
    addLog('±€0', '×1.00', '');
  }

  renderStreak();
  renderStats();
  checkAchievements();
  saveProfile();
  checkBailout();
}

function revealAll() {
  for (let i = 0; i < TOTAL; i++) {
    if (revealed[i]) continue;
    el(`pp${i}`).textContent = '—';
    if (board[i] === 'mine') {
      el(`fb${i}`).className = 'face face-back is-mine';
      el(`fi${i}`).textContent = '💣';
      el(`fi${i}`).className   = 'face-icon';
    } else if (board[i] === 'gold') {
      el(`fb${i}`).className = 'face face-back is-gold';
      el(`fi${i}`).textContent = '🪙';
      el(`fi${i}`).className   = 'face-icon';
    } else {
      el(`fb${i}`).className = 'face face-back is-empty';
      setAdjHint(i);
    }
    el(`c${i}`).classList.add('flipped');
    revealed[i] = true;
  }
}

// ── Probability ───────────────────────────────────────────────────────────────
function updateProbs() {
  if (!active || hiddenLeft === 0) return;
  const blind = boughtEvents.has('blind_luck');
  const pct   = minesLeft / hiddenLeft;
  const prob  = (pct * 100).toFixed(1) + '%';
  const r     = Math.round(100 + pct * 155);
  const g     = Math.round(180 - pct * 160);
  const color = `rgb(${r},${g},60)`;
  for (let i = 0; i < TOTAL; i++) {
    if (!revealed[i] && !warningCells.has(i)) {
      el(`pp${i}`).textContent = blind ? '?' : prob;
      el(`pp${i}`).style.color = blind ? '#9c27b0' : color;
    }
  }
}

// ── Core Renders ──────────────────────────────────────────────────────────────
function renderBalance() {
  el('balanceEl').textContent = fmt(balance);
  checkMilestoneRewards(false);
  renderMilestone();
}

function renderMultiplier(bump = false) {
  const e = el('multEl');
  e.textContent = multiplier.toFixed(2) + '×';
  if (bump) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }
}

function renderWin() {
  const e = el('winEl');
  if (!active) { e.textContent = '—'; return; }
  const streakBonus = Math.min(streak, 3) * 0.05;
  let finalMult = multiplier * (1 + streakBonus);
  if (boughtEvents.has('blind_luck')) finalMult *= 1.3;
  e.textContent = '€ ' + fmt(bet * finalMult);
}

function updateInfoBar() {
  el('iBombs').textContent = minesLeft;
  el('iGold').textContent  = board.filter((t, i) => !revealed[i] && t === 'gold').length;
  el('iEmpty').textContent = board.filter((t, i) => !revealed[i] && t === 'empty').length;
}

function addLog(amount, detail, type) {
  roundLog.unshift({ amount, detail, type });
  if (roundLog.length > 5) roundLog.pop();
  el('logList').innerHTML = roundLog.map(r =>
    `<div class="log-item ${r.type}">
       <span class="log-amount">${r.amount}</span>
       <span class="log-detail">${r.detail}</span>
     </div>`
  ).join('');
}

function setStatus(msg, cls) {
  el('statusEl').textContent = msg || 'Setze deinen Einsatz und starte eine Runde!';
  el('statusEl').className = 'status' + (cls ? ' ' + cls : '');
}

let flashTimer;
function flashStatus(msg, cls) {
  setStatus(msg, cls);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => setStatus('', ''), 2500);
}

// Lokales Feedback direkt im Shop-Panel (nicht im Center)
let sellStatusTimer;
function showSellStatus(msg, type) {
  const e = el('sellStatus');
  if (!e) return;
  e.textContent = msg;
  e.className = 'sell-status-msg ' + type;
  clearTimeout(sellStatusTimer);
  sellStatusTimer = setTimeout(() => { e.textContent = ''; e.className = 'sell-status-msg'; }, 3000);
}

function renderPending() {
  var e = el('pendingNuggets');
  if (!e) return;
  if (active && roundNuggets > 0) {
    el('pendingCount').textContent = roundNuggets;
    e.style.display = 'flex';
  } else {
    e.style.display = 'none';
  }
}

function renderStreak() {
  const d = el('streakDisplay');
  if (streak >= 2) {
    const bonus = Math.min(streak, 3) * 5;
    el('streakCount').textContent = streak;
    el('streakBonus').textContent = `+${bonus}% auf nächsten Cash Out`;
    d.style.display = 'block';
  } else {
    d.style.display = 'none';
  }
}

function showNuggetFloat(cellEl) {
  const rect  = cellEl.getBoundingClientRect();
  const float = document.createElement('div');
  float.className = 'nugget-float';
  float.textContent = '+1 🪙';
  float.style.left = (rect.left + rect.width / 2 - 18) + 'px';
  float.style.top  = (rect.top  + rect.height / 2 - 10) + 'px';
  document.body.appendChild(float);
  float.addEventListener('animationend', () => float.remove());
}

function showToast(msg, color) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.style.cssText += `border-color:${color};color:${color}`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2800);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function renderStats() {
  const winRate = stats.roundsPlayed > 0 ? Math.round(stats.roundsWon / stats.roundsPlayed * 100) : 0;
  const sign    = stats.totalProfit >= 0 ? '+' : '';
  el('sRounds').textContent   = stats.roundsPlayed;
  el('sWinRate').textContent  = winRate + '%';
  el('sProfit').textContent   = sign + '€' + fmt(Math.abs(stats.totalProfit));
  el('sProfit').style.color   = stats.totalProfit >= 0 ? '#4caf50' : '#f44336';
  el('sBigWin').textContent   = '€' + fmt(stats.biggestWin);
  el('sBestMult').textContent = stats.bestMultiplier.toFixed(2) + '×';
  el('sNuggets').textContent  = stats.nuggetsFound;
  el('sSold').textContent     = stats.nuggetsSold;
  el('sMarket').textContent   = '€' + fmt(stats.marketEarned);
}

// ── Achievements ──────────────────────────────────────────────────────────────
function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    if (unlockedAchievements.has(ach.id)) return;
    if (ach.check()) {
      unlockedAchievements.add(ach.id);
      balance += ach.reward;
      renderBalance();
      showToast(`${ach.icon} Erfolg: "${ach.name}"! +€${fmt(ach.reward)}`, '#ffd700');
    }
  });
  renderAchievements();
}

function renderAchievements() {
  const wrap = el('achievementsWrap');
  if (!wrap) return;
  wrap.innerHTML = ACHIEVEMENTS.map(function(ach) {
    const done = unlockedAchievements.has(ach.id);
    var progHtml = '';
    if (ach.progress) {
      const p   = ach.progress();
      const pct = Math.min(100, Math.round(Math.max(0, p.cur / p.max) * 100));
      const pfx = p.prefix || '';
      const sfx = p.suffix || '';
      const cur = p.dec ? Math.min(p.cur, p.max).toFixed(p.dec) : fmt(Math.min(p.cur, p.max));
      const max = p.dec ? p.max.toFixed(p.dec) : fmt(p.max);
      progHtml = '<div class="ach-progress">'
               + '<div class="ach-prog-bar"><div class="ach-prog-fill ' + (done ? 'done' : '') + '" style="width:' + pct + '%"></div></div>'
               + '<div class="ach-prog-label">' + pfx + cur + sfx + ' / ' + pfx + max + sfx + ' <span class="ach-prog-pct">' + pct + '%</span></div>'
               + '</div>';
    }
    return '<div class="ach-item ' + (done ? 'unlocked' : 'locked') + '">'
         + '<span class="ach-icon">' + ach.icon + '</span>'
         + '<div class="ach-info">'
         + '<div class="ach-name">' + ach.name + '</div>'
         + '<div class="ach-desc">' + ach.desc + '</div>'
         + progHtml
         + '</div>'
         + '<div class="ach-reward ' + (done ? 'earned' : '') + '">' + (done ? '✓' : '+€' + fmt(ach.reward)) + '</div>'
         + '</div>';
  }).join('');
}

// ── Freundesliste / Rangliste ─────────────────────────────────────────────────
const LB_KEY = 'gm_leaderboard';

function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveScore() {
  const nameEl = el('friendName');
  const name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { showToast('Bitte einen Namen eingeben!', '#f44336'); return; }
  const board    = loadLeaderboard();
  const existing = board.find(function(e) { return e.name === name; });
  if (existing) {
    if (balance > existing.score) {
      existing.score = balance;
      existing.date  = new Date().toLocaleDateString('de-DE');
    } else {
      showToast(name + ' hat bereits einen höheren Score!', '#ff8c00');
      return;
    }
  } else {
    board.push({ name: name, score: balance, date: new Date().toLocaleDateString('de-DE') });
  }
  board.sort(function(a, b) { return b.score - a.score; });
  localStorage.setItem(LB_KEY, JSON.stringify(board.slice(0, 20)));
  renderFriends();
  showToast('✓ Score gespeichert — €' + fmt(balance), '#4caf50');
}

function deleteFriendIdx(idx) {
  const board = loadLeaderboard();
  board.splice(idx, 1);
  localStorage.setItem(LB_KEY, JSON.stringify(board));
  renderFriends();
}

function renderFriends() {
  var wrap = el('friendsWrap');
  if (!wrap) return;
  var fcs = el('friendCurrentScore');
  if (fcs) fcs.textContent = '€' + fmt(balance);
  var board = loadLeaderboard();
  if (board.length === 0) {
    wrap.innerHTML = '<div class="friends-empty">Noch keine Einträge.<br>Speichere deinen Score!</div>';
    return;
  }
  var medals = ['🥇','🥈','🥉'];
  wrap.innerHTML = board.map(function(entry, i) {
    var level = null;
    for (var m = MILESTONES.length - 1; m >= 0; m--) {
      if (entry.score >= MILESTONES[m].amount) { level = MILESTONES[m]; break; }
    }
    var levelName = level ? level.name : 'Anfänger';
    var medal     = medals[i] || (i + 1) + '.';
    var isMe      = (entry.score === balance && board.filter(function(e){ return e.score === balance; }).length === 1);
    return '<div class="friend-item' + (isMe ? ' is-me' : '') + '">'
         + '<span class="friend-rank">' + medal + '</span>'
         + '<div class="friend-info">'
         + '<div class="friend-name">' + entry.name + (isMe ? ' <span class="friend-you">Du</span>' : '') + '</div>'
         + '<div class="friend-level">' + levelName + ' · ' + entry.date + '</div>'
         + '</div>'
         + '<div class="friend-score">€' + fmt(entry.score) + '</div>'
         + '<button class="friend-del" onclick="deleteFriendIdx(' + i + ')">×</button>'
         + '</div>';
  }).join('');
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TAB_IDS = ['market', 'events', 'stats', 'achievements', 'leaderboard'];

function isMobile() { return window.innerWidth <= 768; }

function switchTab(tab) {
  activeTab = tab;

  // Desktop tab buttons
  TAB_IDS.forEach(function(t) {
    var btn = el('tab-' + t);
    if (btn) btn.classList.toggle('tab-active', t === tab);
  });

  if (isMobile()) {
    var isGame = (tab === 'game');
    el('sidebar').style.display        = isGame ? '' : 'none';
    el('game-center').style.display    = isGame ? '' : 'none';
    el('shop-container').style.display = isGame ? 'none' : '';
    TAB_IDS.forEach(function(t) {
      var p = el('panel-' + t);
      if (p) p.style.display = (!isGame && t === tab) ? 'block' : 'none';
    });
    document.querySelectorAll('.mobile-nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
  } else {
    TAB_IDS.forEach(function(t) {
      var p = el('panel-' + t);
      if (p) p.style.display = t === tab ? 'block' : 'none';
    });
  }
  if (tab === 'leaderboard') renderLeaderboard();
}

// ── Mine Slider ───────────────────────────────────────────────────────────────
function updateSliderUI() {
  const m    = parseInt(el('mineSlider').value, 10);
  nMines     = m;
  const pct  = (m - 1) / 15;
  const rIdx = Math.min(3, Math.floor(pct * 4));
  const { label, color } = RISK[rIdx];

  el('mineCountEl').textContent = m;
  el('mineCountEl').style.color = color;
  el('mineStepEl').textContent  = `+${calcMultStep(m).toFixed(2)}× / Gold`;
  el('mineDistEl').textContent  = `💣×${m} · 🪙×${N_GOLD} · ⬜×${TOTAL - N_GOLD - m}`;
  el('riskLabel').textContent   = label;
  el('riskLabel').style.color   = color;

  const fillPct = ((m - 1) / 15 * 100).toFixed(1);
  el('mineSlider').style.background =
    `linear-gradient(to right,${color} 0%,${color} ${fillPct}%,#1e2d4a ${fillPct}%,#1e2d4a 100%)`;

  const row = el('riskRow');
  row.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const seg = document.createElement('div');
    seg.className = 'risk-seg';
    if (i <= rIdx) seg.style.background = RISK[i].color;
    row.appendChild(seg);
  }

  if (!active) {
    el('iBombs').textContent = m;
    el('iGold').textContent  = N_GOLD;
    el('iEmpty').textContent = TOTAL - N_GOLD - m;
  }
}

// ── Bet Controls ──────────────────────────────────────────────────────────────
function mulBet(f) {
  const inp = el('betInput');
  inp.value = Math.max(1, Math.min(balance, Math.floor((+inp.value || 0) * f)));
}
function maxBet() { el('betInput').value = balance; }
function setBet(v) { el('betInput').value = Math.min(v, balance); }

// ── Market ────────────────────────────────────────────────────────────────────
function initMarket() {
  let p = 45 + Math.floor(Math.random() * 40);
  for (let i = 0; i < 7; i++) {
    p = Math.max(15, Math.min(150, Math.round(p * (1 + (Math.random() - 0.5) * 0.35))));
    priceHistory.push(p);
  }
  marketPrice = priceHistory[priceHistory.length - 1];
  lastPrice   = priceHistory[priceHistory.length - 2] || marketPrice;
  renderShop();
  setInterval(marketTick, 1000);
}

function marketTick() {
  marketTimer--;
  if (marketTimer <= 0) updateMarketPrice();
  renderTimer();
  renderSellPreview();
}

function updateMarketPrice() {
  lastPrice      = marketPrice;
  goldRushActive = Math.random() < 0.12;
  let p = Math.round(marketPrice * (1 + (Math.random() - 0.48) * 0.45));
  p = Math.max(15, Math.min(150, p));
  if (goldRushActive) p = Math.min(150, Math.round(p * 1.65));
  marketPrice = p;
  priceHistory.push(p);
  if (priceHistory.length > 9) priceHistory.shift();
  marketTimer = 120;
  renderShop();
}

function renderShop() {
  renderInventory();
  renderPrice();
  drawPriceChart();
  renderNews();
  renderSellPreview();
}

function renderInventory() {
  var ids = ['invCount', 'sidebarNuggets'];
  ids.forEach(function(id) {
    var e = el(id);
    if (!e) return;
    e.textContent = goldInventory;
    e.classList.remove('nugget-flash');
    void e.offsetWidth;           // reflow to restart animation
    e.classList.add('nugget-flash');
  });
}

function renderPrice() {
  const e  = el('priceEl');
  const tr = el('trendEl');
  e.textContent = fmt(marketPrice);
  e.className = 'price-value' + (marketPrice > lastPrice ? ' up' : marketPrice < lastPrice ? ' down' : '');
  tr.textContent = marketPrice > lastPrice ? '▲' : marketPrice < lastPrice ? '▼' : '→';
  tr.style.color = marketPrice > lastPrice ? '#4caf50' : marketPrice < lastPrice ? '#f44336' : '#ffd700';
  el('goldRushBadge').className = 'gold-rush-badge' + (goldRushActive ? ' active' : '');
}

function drawPriceChart() {
  const svg = el('priceChart');
  if (priceHistory.length < 2) { svg.innerHTML = ''; return; }
  const W   = 190, H = 50;
  const mn  = Math.min.apply(null, priceHistory) * 0.92;
  const mx  = Math.max.apply(null, priceHistory) * 1.08;
  const rng = mx - mn || 1;
  const co  = priceHistory.map(function(p, i) {
    return { x: (i / (priceHistory.length - 1)) * W, y: H - ((p - mn) / rng) * (H - 4) - 2 };
  });
  const last = co[co.length - 1];
  const prev = priceHistory[priceHistory.length - 1];
  const prev2 = priceHistory[priceHistory.length - 2];
  const tc  = prev >= prev2 ? '#4caf50' : '#f44336';
  const pts = co.map(c => c.x.toFixed(1) + ',' + c.y.toFixed(1)).join(' ');
  const area = 'M' + co[0].x + ',' + H + ' ' +
    co.map(c => 'L' + c.x.toFixed(1) + ',' + c.y.toFixed(1)).join(' ') +
    ' L' + last.x + ',' + H + ' Z';
  svg.innerHTML =
    '<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="' + tc + '" stop-opacity=".25"/>' +
    '<stop offset="100%" stop-color="' + tc + '" stop-opacity="0"/>' +
    '</linearGradient></defs>' +
    '<path d="' + area + '" fill="url(#cg)"/>' +
    '<polyline points="' + pts + '" fill="none" stroke="' + tc + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<circle cx="' + last.x.toFixed(1) + '" cy="' + last.y.toFixed(1) + '" r="3.5" fill="' + tc + '" stroke="#060b18" stroke-width="1.5"/>';
}

function renderNews() {
  const e = el('newsTicker');
  if (!e) return;
  e.textContent = goldRushActive
    ? '🌟 Gold Rush! Außergewöhnlich hohe Nachfrage!'
    : MARKET_NEWS[Math.floor(Math.random() * MARKET_NEWS.length)];
}

function renderTimer() {
  const m = Math.floor(marketTimer / 60);
  const s = marketTimer % 60;
  const e = el('timerEl');
  e.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  e.className = 'timer-val' + (marketTimer <= 15 ? ' urgent' : '');
}

function renderSellPreview() {
  const inp = el('sellAmt');
  if (!inp) return;
  const amt = parseInt(inp.value, 10) || 0;
  const can = Math.min(amt, goldInventory);
  const e   = el('sellPreview');
  if (!e) return;
  if (can > 0) { e.textContent = '→ €' + fmt(can * marketPrice); e.className = 'sell-preview positive'; }
  else { e.textContent = goldInventory === 0 ? 'Keine Nuggets' : '→ €0'; e.className = 'sell-preview'; }
}

function sellGold() {
  const inp  = el('sellAmt');
  const amt  = parseInt(inp ? inp.value : 0, 10) || 0;
  const sell = Math.min(amt, goldInventory);
  if (sell <= 0) {
    showSellStatus(goldInventory === 0
      ? 'Du hast keine Nuggets! Spiele eine Runde und finde Gold.'
      : 'Ungültige Anzahl eingeben.', 'loss');
    return;
  }
  const earned = sell * marketPrice;
  goldInventory        -= sell;
  balance              += earned;
  stats.nuggetsSold    += sell;
  stats.marketEarned   += earned;
  renderBalance();
  renderInventory();
  renderSellPreview();
  renderUpgrades();
  renderEventCards();
  renderStats();
  showSellStatus(sell + ' Nugget' + (sell > 1 ? 's' : '') + ' für €' + fmt(earned) + ' verkauft!', 'win');
  checkAchievements();
  saveProfile();
}

function sellAll() {
  if (goldInventory === 0) {
    showSellStatus('Du hast keine Nuggets zum Verkaufen.', 'loss');
    return;
  }
  const inp = el('sellAmt');
  if (inp) inp.value = goldInventory;
  sellGold();
}

// ── Bailout ───────────────────────────────────────────────────────────────────
const BAILOUT_MSGS = [
  'Herzlichen Glückwunsch zum Totalverlust! In beeindruckend kurzer Zeit hast du bewiesen, dass Risikomanagement nicht deine Stärke ist. Selbst ein blindes Huhn findet manchmal ein Korn – du anscheinend nicht.',
  '€0,00. Nicht mal genug für einen Kaugummi. Irgendwie schaffst du es, schlechter abzuschneiden als das Haus – und das Haus gewinnt eigentlich immer.',
  'Die Goldminen haben dich besiegt. Vollständig. Du hast das Unmögliche möglich gemacht: komplett Pleite, obwohl 32 % der Felder Gold enthielten.',
  'Dein Konto ist so leer wie deine Strategie. Statistisch liegt die Chance, so schnell alles zu verlieren, unter 1 % – Glückwunsch zur seltenen Leistung!',
  'Null Euro. In der Welt der Finanzen nennt man das einen „Lernmoment". Du hast heute gelernt: Gold Minesweeper und Altersvorsorge sind sehr verschiedene Konzepte.',
];

function checkBailout() {
  if (balance >= 1) return;
  const msgs = BAILOUT_MSGS;
  el('bailoutMsg').textContent = msgs[Math.floor(Math.random() * msgs.length)];
  el('bailoutOverlay').style.display = 'flex';
  document.body.classList.add('game-over');
}

function acceptBailout() {
  balance       += 50;
  goldInventory -= 5;
  renderBalance();
  renderInventory();
  renderUpgrades();
  el('bailoutOverlay').style.display = 'none';
  document.body.classList.remove('game-over');
  showToast('💸 Notkredit: +€50 Guthaben, −5 🪙 Nuggets', '#ff8c00');
  saveProfile();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function openAuthModal()  { el('authOverlay').style.display = 'flex'; }
function closeAuthModal() { el('authOverlay').style.display = 'none'; setAuthMsg(''); }

function switchAuthTab(tab) {
  el('authLogin').style.display    = tab === 'login'    ? 'block' : 'none';
  el('authRegister').style.display = tab === 'register' ? 'block' : 'none';
  el('authTabLogin').classList.toggle('active',    tab === 'login');
  el('authTabRegister').classList.toggle('active', tab === 'register');
  setAuthMsg('');
}

function setAuthMsg(msg, isErr) {
  const e = el('authMsg');
  e.textContent = msg;
  e.className = 'auth-msg' + (isErr ? ' error' : msg ? ' ok' : '');
}

async function signUp() {
  const username = el('registerUsername').value.trim();
  const email    = el('registerEmail').value.trim();
  const password = el('registerPassword').value;
  if (!username || !email || !password) { setAuthMsg('Bitte alle Felder ausfüllen.', true); return; }
  if (password.length < 6)             { setAuthMsg('Passwort muss mindestens 6 Zeichen haben.', true); return; }
  setAuthMsg('Wird erstellt…');
  const { error } = await sbClient.auth.signUp({ email, password, options: { data: { username } } });
  if (error) { setAuthMsg(error.message, true); return; }
  // Direkt einloggen nach Registrierung
  const { error: loginErr } = await sbClient.auth.signInWithPassword({ email, password });
  if (!loginErr) { closeAuthModal(); return; }
  setAuthMsg('✓ Account erstellt! Jetzt anmelden.');
}

async function signIn() {
  const email    = el('loginEmail').value.trim();
  const password = el('loginPassword').value;
  if (!email || !password) { setAuthMsg('E-Mail und Passwort eingeben.', true); return; }
  setAuthMsg('Anmeldung läuft…');
  const { error } = await sbClient.auth.signInWithPassword({ email, password });
  if (error) { setAuthMsg(error.message, true); return; }
  closeAuthModal();
}

async function doSignOut() {
  await sbClient.auth.signOut();
}

function applyUserState(user) {
  currentUser = user;
  el('userBarGuest').style.display    = user ? 'none' : 'flex';
  el('userBarLoggedIn').style.display = user ? 'flex' : 'none';
  if (user) loadProfile();
}

// ── Profile ───────────────────────────────────────────────────────────────────
async function saveProfile() {
  if (!currentUser) return;
  await sbClient.from('profiles').update({
    balance,
    gold_inventory:        goldInventory,
    streak,
    stats,
    unlocked_achievements: [...unlockedAchievements],
    reached_milestones:    [...reachedMilestones]
  }).eq('id', currentUser.id);
}

async function loadProfile() {
  if (!currentUser) return;
  const { data } = await sbClient.from('profiles').select('*').eq('id', currentUser.id).single();
  if (!data) return;

  balance       = data.balance;
  goldInventory = data.gold_inventory;
  streak        = data.streak;
  stats         = Object.assign({}, stats, data.stats);
  unlockedAchievements = new Set(data.unlocked_achievements || []);
  reachedMilestones    = new Set(data.reached_milestones   || []);

  el('userBarName').textContent = data.username;

  renderBalance();
  renderInventory();
  renderStreak();
  renderStats();
  renderAchievements();
  checkMilestoneRewards(true);
  renderMilestone();
  showToast('👋 Willkommen zurück, ' + data.username + '!', '#4caf50');
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function renderLeaderboard() {
  const wrap = el('leaderboardWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div class="friends-empty">Laden…</div>';

  const { data, error } = await sbClient
    .from('profiles')
    .select('username, balance')
    .order('balance', { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) {
    wrap.innerHTML = '<div class="friends-empty">Noch keine Einträge.</div>';
    return;
  }

  const medals  = ['🥇', '🥈', '🥉'];
  const myName  = currentUser ? el('userBarName').textContent : '';
  wrap.innerHTML = data.map(function(entry, i) {
    var level = null;
    for (var m = MILESTONES.length - 1; m >= 0; m--) {
      if (entry.balance >= MILESTONES[m].amount) { level = MILESTONES[m]; break; }
    }
    var isMe  = myName && entry.username === myName;
    var medal = medals[i] || (i + 1) + '.';
    return '<div class="friend-item' + (isMe ? ' is-me' : '') + '">'
      + '<span class="friend-rank">' + medal + '</span>'
      + '<div class="friend-info">'
      + '<div class="friend-name">' + entry.username + (isMe ? ' <span class="friend-you">Du</span>' : '') + '</div>'
      + '<div class="friend-level">' + (level ? level.name : 'Anfänger') + '</div>'
      + '</div>'
      + '<div class="friend-score">€' + fmt(entry.balance) + '</div>'
      + '</div>';
  }).join('');
}

// ── Win Animation ─────────────────────────────────────────────────────────────
function triggerWinAnimation() {
  // Gold cells pulse
  board.forEach(function(type, i) {
    if (type === 'gold') {
      el('c' + i).classList.add('win-gold-pulse');
      setTimeout(function() { el('c' + i).classList.remove('win-gold-pulse'); }, 1400);
    }
  });

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'win-overlay';
  overlay.innerHTML =
    '<div class="win-trophy">🏆</div>' +
    '<div class="win-text">Perfekte Runde!</div>' +
    '<div class="win-sub">Alle Goldfelder aufgedeckt!</div>';
  document.body.appendChild(overlay);
  setTimeout(function() {
    overlay.classList.add('fade-out');
    setTimeout(function() { overlay.remove(); }, 500);
  }, 2400);

  // Confetti
  for (let i = 0; i < 55; i++) {
    setTimeout(createConfettiParticle, Math.random() * 900);
  }
}

function createConfettiParticle() {
  const colors = ['#ffd700', '#ff8c00', '#4caf50', '#ffffff', '#ff6b6b', '#64b5f6', '#ce93d8'];
  const p = document.createElement('div');
  p.className = 'confetti-p';
  p.style.left     = (4 + Math.random() * 92) + 'vw';
  p.style.background = colors[Math.floor(Math.random() * colors.length)];
  p.style.width    = p.style.height = (6 + Math.random() * 7) + 'px';
  p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
  p.style.animationDuration = (1.3 + Math.random() * 1.4) + 's';
  p.style.animationDelay    = (Math.random() * 0.2) + 's';
  document.body.appendChild(p);
  p.addEventListener('animationend', function() { p.remove(); });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
el('mineSlider').addEventListener('input', updateSliderUI);
el('sellAmt').addEventListener('input', renderSellPreview);
el('btnSell').addEventListener('click', sellGold);
el('btnSellAll').addEventListener('click', sellAll);

TAB_IDS.forEach(function(t) {
  var btn = el('tab-' + t);
  if (btn) btn.addEventListener('click', function() { switchTab(t); });
});
document.querySelectorAll('.mobile-nav-btn').forEach(function(btn) {
  btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
});

// Auth state
sbClient.auth.onAuthStateChange(function(_event, session) {
  applyUserState(session ? session.user : null);
});
sbClient.auth.getSession().then(function(r) {
  applyUserState(r.data.session ? r.data.session.user : null);
});

// Echtzeit-Rangliste: bei jeder Änderung an profiles neu laden wenn Tab offen
sbClient
  .channel('leaderboard-live')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, function() {
    if (activeTab === 'leaderboard') renderLeaderboard();
  })
  .subscribe();

checkMilestoneRewards(true);   // Startzustand markieren, keine Belohnung
renderBalance();
renderMilestone();
renderMultiplier();
updateSliderUI();
renderUpgrades();
drawNewCards();
renderStats();
renderAchievements();
renderFriends();
renderInventory();
switchTab(isMobile() ? 'game' : 'market');
initMarket();
renderTimer();
