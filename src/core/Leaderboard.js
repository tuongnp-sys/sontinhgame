const STORAGE_KEY = 'sontinh_leaderboard';
const MAX_ENTRIES = 8;

/**
 * @typedef {object} LeaderboardEntry
 * @property {number} timeSurvived
 * @property {boolean} victory
 * @property {number} score
 * @property {number} peakGap
 * @property {number} [level]
 * @property {number} date
 */

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
 * @param {Omit<LeaderboardEntry, 'date'>} entry
 * @returns {{ list: LeaderboardEntry[], rank: number }}
 */
export function addLeaderboardEntry(entry) {
  const stamped = { level: 1, ...entry, date: Date.now() };
  const list = [...getLeaderboard(), stamped];
  list.sort(compareEntries);
  const trimmed = list.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

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
function compareEntries(a, b) {
  if (a.victory !== b.victory) return a.victory ? -1 : 1;
  if (b.score !== a.score) return b.score - a.score;
  return b.timeSurvived - a.timeSurvived;
}

/**
 * @param {LeaderboardEntry[]} list
 * @returns {string[]}
 */
export function formatLeaderboardLines(list) {
  if (!list.length) {
    return ['No runs yet — be the first!'];
  }
  return list.map((e, i) => {
    const lv = e.level ?? 1;
    const tag = e.victory ? (lv >= 3 ? 'MAX WIN' : `L${lv} WIN`) : lv >= 3 ? 'MAX' : `L${lv}`;
    return `${i + 1}. ${tag}  ${e.timeSurvived}s  ·  ${e.score}pts`;
  });
}
