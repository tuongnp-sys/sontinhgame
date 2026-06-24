/** @typedef {import('./GameState.js').GameState} GameState */
/** @typedef {import('./DisruptorSystem.js').DisruptorSystem} DisruptorSystem */
/** @typedef {import('./FloodSystem.js').FloodSystem} FloodSystem */

/**
 * Director — intensity wave (calm / rise / climax) + disruptor.
 */
export class Director {
  /**
   * @param {object} balance
   * @param {object} disruptorConfig
   */
  constructor(balance, disruptorConfig) {
    this.balance = balance;
    this.config = disruptorConfig;
    this.cooldowns = {};
    this.elapsedMs = 0;
    this.lastPhase = '';
  }

  reset() {
    this.cooldowns = {};
    this.elapsedMs = 0;
    this.lastPhase = '';
  }

  /**
   * Cập nhật phase nhịp thở — gọi mỗi frame trước rhythm/flood.
   * @param {GameState} state
   * @returns {boolean} phase vừa đổi
   */
  updatePhase(state) {
    const wave = this.balance.intensityWave;
    const lv = state.levelCfg;
    const calm = lv.calmSeconds ?? wave.calm;
    const rise = wave.rise;
    const climax = wave.climax;
    const cycle = calm + rise + climax;
    const t = state.elapsed % cycle;

    let phase;
    if (t < calm) phase = 'calm';
    else if (t < calm + rise) phase = 'rise';
    else phase = 'climax';

    const changed = phase !== this.lastPhase;
    this.lastPhase = phase;

    state.intensityPhase = phase;
    state.isCalmPhase = phase === 'calm';
    const bpmBoost = lv.phaseBpmMulBoost ?? 1;

    if (phase === 'calm') {
      state.phaseWaterMul = lv.calmWaterMul ?? wave.calmWaterMul;
      state.phaseBpmMul = (lv.calmBpmMul ?? wave.calmBpmMul) * bpmBoost;
      state.allowPoison = false;
      state.allowDisruptors = false;
      if (changed) {
        state.isBlinded = false;
        state.blindRemaining = 0;
        state.isFlashFlood = false;
        state.flashFloodRemaining = 0;
      }
    } else if (phase === 'rise') {
      state.phaseWaterMul = 1;
      state.phaseBpmMul = 1 * bpmBoost;
      state.allowPoison = true;
      state.allowDisruptors = true;
    } else {
      state.phaseWaterMul = lv.climaxWaterMul ?? wave.climaxWaterMul;
      state.phaseBpmMul = (lv.climaxBpmMul ?? wave.climaxBpmMul) * bpmBoost;
      state.allowPoison = true;
      state.allowDisruptors = true;
    }

    state.phaseChanged = changed;
    return changed;
  }

  /**
   * @param {GameState} state
   * @param {DisruptorSystem} disruptor
   * @param {FloodSystem} flood
   * @returns {{type: string}|null}
   */
  evaluate(state, disruptor, flood) {
    if (!state.allowDisruptors) {
      state.directorStress = 0;
      return null;
    }

    const stress = this._computeStress(state);
    state.directorStress = stress;

    if (stress < 0.35) return null;

    if (stress >= 0.55 && this._canFire('flash_flood')) {
      this._setCooldown('flash_flood', this.config.flash_flood.cooldownMs);
      flood.triggerFlashFlood(state);
      return { type: 'flash_flood' };
    }

    if (stress >= 0.4 && this._canFire('poison_burst')) {
      this._setCooldown('poison_burst', this.config.poison_burst.cooldownMs);
      return { type: 'poison_burst' };
    }

    return null;
  }

  /**
   * @param {GameState} state
   */
  _computeStress(state) {
    const danger = state.dangerRatio;
    const comboFactor = Math.min(1, state.combo / 40);
    const timeFactor = Math.min(1, state.elapsed / state.sessionDuration);
    return danger * 0.5 + comboFactor * 0.3 + timeFactor * 0.2;
  }

  /**
   * @param {string} id
   */
  _canFire(id) {
    const until = this.cooldowns[id] ?? 0;
    return this.elapsedMs >= until;
  }

  /**
   * @param {string} id
   * @param {number} ms
   */
  _setCooldown(id, ms) {
    this.cooldowns[id] = this.elapsedMs + ms;
  }

  /**
   * @param {number} dt
   */
  tick(dt) {
    this.elapsedMs += dt * 1000;
  }
}
