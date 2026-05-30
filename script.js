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
  { id: 'insurance', name: 'Versicherung', icon: '🛡️', cost: 3,  desc: 'Mine → 50% Einsatz zurück' },
  { id: 'xray',      name: 'Röntgenblick', icon: '👁️', cost: 5,  desc: '2 sichere Felder aufgedeckt' },
  { id: 'charm',     name: 'Glücksbringer', icon: '🍀', cost: 12, desc: '1 Mine wird zu Gold' },
  { id: 'joker',     name: 'Joker',         icon: '🃏', cost: 18, desc: '1 Mine übersteht – Runde läuft weiter' },
];

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
  { amount: 1000000, label: '€1M',    name: 'Millionär',    nuggets: 300 },
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

let boughtUpgrades = new Set();
let boughtEvents   = new Set();
let drawnCards     = [];

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
};

let unlockedAchievements = new Set();
let activeTab = 'market';

// ── Helpers ───────────────────────────────────────────────────────────────────
const el  = id => document.getElementById(id);
const fmt = n  => Math.round(n).toLocaleString('de-DE');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

  if (boughtUpgrades.has(id)) {
    boughtUpgrades.delete(id);
    goldInventory += upg.cost;
    showToast(upg.icon + ' ' + upg.name + ' deaktiviert  (+' + upg.cost + ' 🪙 zurück)', '#8892b0');
  } else {
    if (goldInventory < upg.cost) {
      showToast('Zu wenig Nuggets — ' + upg.cost + ' 🪙 für ' + upg.name + ' benötigt.', '#f44336');
      return;
    }
    if (id === 'charm' && nMines < 2) {
      showToast('Glücksbringer braucht mindestens 2 Minen!', '#f44336');
      return;
    }
    boughtUpgrades.add(id);
    goldInventory -= upg.cost;
    showToast('✓ ' + upg.icon + ' ' + upg.name + ' aktiviert!  (−' + upg.cost + ' 🪙)', '#4caf50');
  }
  renderInventory();
  renderUpgrades();
  renderEventCards();
}

function renderUpgrades() {
  const wrap = el('upgradesWrap');
  if (!wrap) return;
  wrap.innerHTML = UPGRADES.map(u => {
    const bought    = boughtUpgrades.has(u.id);
    const canAfford = goldInventory >= u.cost;
    return '<div class="upg-btn ' + (bought ? 'active' : '') + ' ' + (!canAfford && !bought ? 'cant-afford' : '') + '"'
         + ' onclick="toggleUpgrade(\'' + u.id + '\')" title="' + u.desc + '">'
         + '<span class="upg-icon">' + u.icon + '</span>'
         + '<span class="upg-name">' + u.name + '</span>'
         + '<span class="upg-cost">' + (bought ? '✓ aktiv' : u.cost + ' 🪙') + '</span>'
         + '</div>';
  }).join('');
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
  if (goldInventory < card.cost) {
    showToast('Zu wenig Nuggets! ' + card.cost + ' 🪙 für ' + card.name + ' benötigt.', '#f44336');
    return;
  }
  boughtEvents.add(id);
  goldInventory -= card.cost;
  showToast('✓ ' + card.icon + ' ' + card.name + ' aktiviert!  (−' + card.cost + ' 🪙)', '#4caf50');
  renderInventory();
  renderEventCards();
  renderUpgrades();
}

function renderEventCards() {
  const wrap = el('eventCardsWrap');
  if (!wrap) return;
  wrap.innerHTML = drawnCards.map(function(card) {
    const bought    = boughtEvents.has(card.id);
    const canAfford = goldInventory >= card.cost;
    return '<div class="event-card ' + (bought ? 'bought' : '') + ' ' + (!canAfford && !bought ? 'cant-afford' : '') + '"'
         + ' style="--card-color:' + card.color + '"'
         + ' onclick="buyEventCard(\'' + card.id + '\')">'
         + '<div class="ec-icon">' + card.icon + '</div>'
         + '<div class="ec-name">' + card.name + '</div>'
         + '<div class="ec-desc">' + card.desc + '</div>'
         + '<div class="ec-cost">' + (bought ? '✓ Aktiv' : card.cost + ' 🪙') + '</div>'
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
  active     = true;
  jokerUsed  = false;
  warningCells.clear();
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

  // Röntgenblick
  if (boughtUpgrades.has('xray')) {
    const safe = board.map((t, i) => (t !== 'mine' && !warningCells.has(i)) ? i : -1).filter(i => i >= 0);
    shuffle([...safe]).slice(0, 2).forEach(i => autoRevealCell(i));
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
    goldInventory++;
    stats.nuggetsFound++;
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

    setTimeout(() => { revealAll(); endRound('loss'); }, 480);

  } else if (board[i] === 'gold') {
    const step = calcMultStep(nMines) * (boughtEvents.has('double_gold') ? 2 : 1);
    multiplier += step;
    goldInventory++;
    stats.nuggetsFound++;
    el(`fb${i}`).className = 'face face-back is-gold pulse';
    el(`fi${i}`).textContent = '🪙';
    showNuggetFloat(el(`c${i}`));
    renderMultiplier(true);
    renderWin();
    renderInventory();
    renderUpgrades();
    renderEventCards();
    updateProbs();
    updateInfoBar();

    const safeLeft = board.filter((t, j) => !revealed[j] && t !== 'mine' && !warningCells.has(j)).length;
    if (safeLeft === 0) setTimeout(() => cashOut(), 400);

  } else {
    el(`fb${i}`).className = 'face face-back is-empty';
    el(`fi${i}`).textContent = '○';
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
  revealAll();
  endRound('win', total, streakBonus, finalMult);
}

function endRound(result, amount, streakBonus = 0, finalMult = multiplier) {
  active = false;
  for (let i = 0; i < TOTAL; i++) el(`c${i}`).classList.remove('clickable');
  el('btnStart').disabled   = false;
  el('btnCashout').disabled = true;
  el('betInput').disabled   = false;
  el('mineSlider').disabled = false;
  el('tab-events').disabled = false;

  boughtUpgrades.clear();
  drawNewCards();
  renderUpgrades();
  renderBalance();
  renderWin();

  if (result === 'win') {
    streak++;
    const profit = amount - bet;
    stats.roundsWon++;
    stats.totalProfit    += profit;
    stats.biggestWin      = Math.max(stats.biggestWin, amount);
    stats.bestMultiplier  = Math.max(stats.bestMultiplier, finalMult);
    const bonusTxt = streakBonus > 0 ? ` (+${Math.round(streakBonus * 100)}% Streak)` : '';
    setStatus(`Cash Out: €${fmt(amount)}  (+€${fmt(profit)})${bonusTxt}`, 'win');
    addLog(`+€${fmt(profit)}`, `×${finalMult.toFixed(2)}`, 'win');
  } else {
    if (boughtUpgrades.has('insurance')) {
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
  }

  renderStreak();
  renderStats();
  checkAchievements();
}

function revealAll() {
  for (let i = 0; i < TOTAL; i++) {
    if (revealed[i]) continue;
    el(`pp${i}`).textContent = '—';
    if      (board[i] === 'mine') { el(`fb${i}`).className = 'face face-back is-mine'; el(`fi${i}`).textContent = '💣'; }
    else if (board[i] === 'gold') { el(`fb${i}`).className = 'face face-back is-gold'; el(`fi${i}`).textContent = '🪙'; }
    else                          { el(`fb${i}`).className = 'face face-back is-empty'; el(`fi${i}`).textContent = '○'; }
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

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TAB_IDS = ['market', 'events', 'stats', 'achievements'];

function switchTab(tab) {
  activeTab = tab;
  TAB_IDS.forEach(t => {
    const btn   = el('tab-' + t);
    const panel = el('panel-' + t);
    if (btn)   btn.classList.toggle('tab-active', t === tab);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });
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

// ── Boot ──────────────────────────────────────────────────────────────────────
el('mineSlider').addEventListener('input', updateSliderUI);
el('sellAmt').addEventListener('input', renderSellPreview);
el('btnSell').addEventListener('click', sellGold);
el('btnSellAll').addEventListener('click', sellAll);

TAB_IDS.forEach(t => {
  const btn = el('tab-' + t);
  if (btn) btn.addEventListener('click', () => switchTab(t));
});

checkMilestoneRewards(true);   // Startzustand markieren, keine Belohnung
renderBalance();
renderMilestone();
renderMultiplier();
updateSliderUI();
renderUpgrades();
drawNewCards();
renderStats();
renderAchievements();
renderInventory();
switchTab('market');
initMarket();
renderTimer();
