import { getPlayerName, normalizePlayerName, setPlayerName } from '../core/Leaderboard.js';

const OVERLAY_ID = 'sontinh-name-overlay';

/**
 * Modal DOM nhập tên — keyboard mobile ổn định hơn Phaser text field.
 * @param {{ title?: string, onSaved?: (name: string) => void, onCancel?: () => void }} [opts]
 * @returns {Promise<string|null>}
 */
export function showPlayerNameModal(opts = {}) {
  return new Promise((resolve) => {
    const existing = document.getElementById(OVERLAY_ID);
    existing?.remove();

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `
      <div class="sontinh-name-panel" role="dialog" aria-modal="true">
        <h2 class="sontinh-name-title">${opts.title || 'Choose your name'}</h2>
        <p class="sontinh-name-hint">2–16 characters · saved on this device</p>
        <input type="text" class="sontinh-name-input" maxlength="16" autocomplete="nickname" enterkeyhint="done" />
        <p class="sontinh-name-error" hidden></p>
        <div class="sontinh-name-actions">
          <button type="button" class="sontinh-name-cancel">Cancel</button>
          <button type="button" class="sontinh-name-save">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('.sontinh-name-input');
    const err = overlay.querySelector('.sontinh-name-error');
    const btnSave = overlay.querySelector('.sontinh-name-save');
    const btnCancel = overlay.querySelector('.sontinh-name-cancel');

    input.value = getPlayerName();

    const close = (name) => {
      overlay.remove();
      if (name) {
        opts.onSaved?.(name);
        resolve(name);
      } else {
        opts.onCancel?.();
        resolve(null);
      }
    };

    const trySave = () => {
      const name = setPlayerName(input.value);
      if (!name) {
        err.hidden = false;
        err.textContent = 'Enter at least 2 characters.';
        input.focus();
        return;
      }
      close(name);
    };

    btnSave.addEventListener('click', trySave);
    btnCancel.addEventListener('click', () => close(null));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') trySave();
      if (e.key === 'Escape') close(null);
    });

    setTimeout(() => input.focus(), 80);
  });
}

/**
 * @returns {Promise<string|null>}
 */
export function ensurePlayerName() {
  const current = getPlayerName();
  if (current && normalizePlayerName(current).length >= 2) {
    return Promise.resolve(current);
  }
  return showPlayerNameModal({ title: 'Enter your name to play' });
}
