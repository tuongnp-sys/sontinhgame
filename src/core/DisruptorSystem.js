/** @typedef {import('./GameState.js').GameState} GameState */

/**
 * Disruptor: nốt độc (spawn), mực che mắt, lũ quét.
 */
export class DisruptorSystem {
  /**
   * @param {object} balance
   */
  constructor(balance) {
    this.balance = balance;
    this.inkTimer = 0;
    this.inkCooldown = 0;
    this.lastInkAt = -999;
  }

  reset() {
    this.inkTimer = 0;
    this.inkCooldown = 0;
    this.lastInkAt = -999;
  }

  /**
   * @param {number} dt
   * @param {GameState} state
   */
  tick(dt, state) {
    if (!state.allowDisruptors) return;

    this.inkTimer += dt * 1000;

    if (!state.isBlinded && this.inkTimer - this.lastInkAt >= this.balance.inkIntervalMs) {
      this.triggerInk(state);
      this.lastInkAt = this.inkTimer;
    }
  }

  /**
   * @param {GameState} state
   */
  triggerInk(state) {
    state.isBlinded = true;
    state.blindRemaining = this.balance.inkDurationMs / 1000;
  }

  /**
   * @param {GameState} state
   */
  triggerFlashFlood(state) {
    state.isFlashFlood = true;
    state.flashFloodRemaining = this.balance.flashFloodDuration;
  }
}
