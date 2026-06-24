/** @typedef {import('./GameState.js').GameState} GameState */

/**
 * Hệ thống nước dâng — áp lực thời gian cốt lõi.
 */
export class FloodSystem {
  /**
   * @param {object} balance
   */
  constructor(balance) {
    this.balance = balance;
  }

  /**
   * @param {number} dt giây
   * @param {GameState} state
   */
  tick(dt, state) {
    if (state.elephantStunRemaining > 0) {
      return;
    }

    const rise = this.balance.waterRisePerSecond * state.waterMultiplier * dt;
    state.waterLevel += rise;

    if (state.activeBeast === 'chicken') {
      state.waterLevel -= rise * 0.3;
    }
  }

  /**
   * Kích hoạt lũ quét đột ngột
   * @param {GameState} state
   */
  triggerFlashFlood(state) {
    state.isFlashFlood = true;
    state.flashFloodRemaining = this.balance.flashFloodDuration;
  }
}
