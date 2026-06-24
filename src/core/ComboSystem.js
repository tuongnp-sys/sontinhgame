/** @typedef {import('./GameState.js').GameState} GameState */

/**
 * Combo milestones → triệu hồi linh thú.
 */
export class ComboSystem {
  /**
   * @param {object} balance
   */
  constructor(balance) {
    this.balance = balance;
    this.triggered = { chicken: false, elephant: false, horse: false };
  }

  reset() {
    this.triggered = { chicken: false, elephant: false, horse: false };
  }

  /**
   * @param {GameState} state
   * @returns {string|null} beast id vừa kích hoạt
   */
  checkMilestones(state) {
    const m = this.balance.comboMilestones;
    const combo = state.combo;

    if (!this.triggered.chicken && combo >= m.chicken) {
      this.triggered.chicken = true;
      return this._activate('chicken', state);
    }
    if (!this.triggered.elephant && combo >= m.elephant) {
      this.triggered.elephant = true;
      return this._activate('elephant', state);
    }
    if (!this.triggered.horse && combo >= m.horse) {
      this.triggered.horse = true;
      return this._activate('horse', state);
    }
    return null;
  }

  /**
   * @param {string} beastId
   * @param {GameState} state
   */
  _activate(beastId, state) {
    const b = this.balance;
    state.activeBeast = beastId;
    state.lastBeastTriggered = beastId;

    if (beastId === 'chicken') {
      state.beastRemaining = b.beastChickenDuration;
    } else if (beastId === 'elephant') {
      state.beastRemaining = b.beastElephantStun;
      state.elephantStunRemaining = b.beastElephantStun;
    } else if (beastId === 'horse') {
      const restore = (b.initialMountain - state.waterLevel) * b.beastHorseGapRestore;
      state.applyGapChange(Math.max(15, restore));
      state.isComboLocked = false;
      state.comboLockRemaining = 0;
      state.beastRemaining = 2;
    }
    return beastId;
  }
}
