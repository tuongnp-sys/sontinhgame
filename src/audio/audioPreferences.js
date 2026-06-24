import { bgmController } from './BgmController.js';
import { audioManager } from './AudioManager.js';

const STORAGE_KEY = 'sontinh_muted';

export function loadMutedPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * @param {boolean} muted
 */
export function saveMutedPreference(muted) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** @returns {boolean} */
export function applyMutedPreference() {
  const muted = loadMutedPreference();
  bgmController.setMuted(muted);
  audioManager.setMuted(muted);
  return muted;
}

/**
 * @returns {boolean} new muted state
 */
export function toggleMutedPreference() {
  const next = !loadMutedPreference();
  saveMutedPreference(next);
  bgmController.setMuted(next);
  return next;
}
