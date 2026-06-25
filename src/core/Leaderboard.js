const STORAGE_KEY = 'sontinh_leaderboard';
const PLAYER_NAME_KEY = 'sontinh_player_name';
const PLAYER_BESTS_KEY = 'sontinh_player_bests';
const MAX_ENTRIES = 12;
const MAX_NAME_LEN = 16;
const MIN_NAME_LEN = 2;

/**
 * @typedef {object} LeaderboardEntry
 * @property {string} playerName
 * @property {number} timeSurvived
 * @property {boolean} victory
 * @property {number} score
 * @property {number} peakGap
 * @property {number} [level]
 * @property {number} date
 */

/** @returns {string} */
export function getPlayerName() {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizePlayerName(raw) {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LEN);
}

/**
 * @param {string} raw
 * @returns {string|null} saved name or null if invalid
 */
export function setPlayerName(raw) {
  const name = normalizePlayerName(raw);
  if (name.length < MIN_NAME_LEN) return null;
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch {
    return null;
  }
  return name;
}

/** @returns {Record<string, LeaderboardEntry>} */
function getPlayerBestsMap() {
  try {
    const raw = localStorage.getItem(PLAYER_BESTS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map && typeof map === 'object' ? map : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} [playerName]
 * @returns {LeaderboardEntry|null}
 */
export function getPlayerBest(playerName = getPlayerName()) {
  const key = normalizePlayerName(playerName).toLowerCase();
  if (!key) return null;
  return getPlayerBestsMap()[key] ?? null;
}

/**
 * @param {LeaderboardEntry} entry
 */
function updatePlayerBest(entry) {
  const key = normalizePlayerName(entry.playerName).toLowerCase();
  if (!key) return;
  const map = getPlayerBestsMap();
  const prev = map[key];
  if (!prev || isEntryBetter(entry, prev)) {
    map[key] = { ...entry };
    try {
      localStorage.setItem(PLAYER_BESTS_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
}

/** @returns {LeaderboardEntry[]} */
export function getLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * @param {Omit<LeaderboardEntry, 'date' | 'playerName'> & { playerName?: string }} entry
 * @returns {{ list: LeaderboardEntry[], rank: number }}
 */
export function addLeaderboardEntry(entry) {
  const playerName = normalizePlayerName(entry.playerName || getPlayerName()) || 'Guest';
  const stamped = {
    level: 1,
    ...entry,
    playerName,
    date: Date.now(),
  };

  updatePlayerBest(stamped);

  const list = [...getLeaderboard(), stamped];
  list.sort(compareEntries);
  const trimmed = list.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }

  const rank = trimmed.findIndex((e) => e.date === stamped.date) + 1;

  if (entry.victory) {
    const best = parseInt(localStorage.getItem('sontinh_best_time') || '0', 10);
    if (entry.timeSurvived > best) {
      localStorage.setItem('sontinh_best_time', String(entry.timeSurvived));
    }
  }

  return { list: trimmed, rank: rank > 0 ? rank : trimmed.length };
}

/**
 * @param {LeaderboardEntry} a
 * @param {LeaderboardEntry} b
 */
function isEntryBetter(a, b) {
  return compareEntries(a, b) < 0;
}

/**
 * @param {LeaderboardEntry} a
 * @param {LeaderboardEntry} b
 */
function compareEntries(a, b) {
  if (a.victory !== b.victory) return a.victory ? -1 : 1;
  if (b.score !== a.score) return b.score - a.score;
  return b.timeSurvived - a.timeSurvived;
}

/**
 * @param {LeaderboardEntry} e
 * @returns {string}
 */
export function formatEntryTag(e) {
  const lv = e.level ?? 1;
  return e.victory ? (lv >= 3 ? 'MAX WIN' : `L${lv} WIN`) : lv >= 3 ? 'MAX' : `L${lv}`;
}

/**
 * @param {LeaderboardEntry} e
 * @param {number} [rank]
 * @returns {string}
 */
export function formatEntryLine(e, rank) {
  const tag = formatEntryTag(e);
  const name = (e.playerName || 'Guest').slice(0, 10);
  const prefix = rank != null ? `${rank}. ` : '';
  return `${prefix}${name}  ${tag}  ${e.timeSurvived}s  ·  ${e.score}pts`;
}

/**
 * @param {LeaderboardEntry[]} list
 * @returns {string[]}
 */
export function formatLeaderboardLines(list) {
  if (!list.length) {
    return ['No runs yet — be the first!'];
  }
  return list.map((e, i) => formatEntryLine(e, i + 1));
}

/**
 * @param {LeaderboardEntry|null} best
 * @param {string} [playerName]
 * @returns {string}
 */
export function formatPlayerBestLine(best, playerName = getPlayerName()) {
  if (!playerName) return 'Set your name to track personal best.';
  if (!best) return `${playerName}: no runs yet.`;
  return `YOUR BEST — ${formatEntryLine(best)}`;
}
