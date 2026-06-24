/** @typedef {'earth'|'wood'|'fire'|'poison'|'hold'} NoteType */
/** @typedef {'perfect'|'great'|'good'|'miss'|'poison_hit'|'ignore'|'hold_start'|'hold_complete'|'locked'} HitResult */

import { getLevelConfig } from './levelConfig.js';

/**
 * Trạng thái trận đấu — logic thuần, không phụ thuộc Phaser.
 */
export class GameState {
  /**
   * @param {object} balance
   */
  constructor(balance) {
    this.balance = balance;
    this.gameLevel = 1;
    this.levelCfg = getLevelConfig(balance, 1);
    this.reset(1);
  }

  /**
   * @param {number} [gameLevel]
   */
  reset(gameLevel = 1) {
    this.gameLevel = gameLevel;
    this.levelCfg = getLevelConfig(this.balance, gameLevel);
    const b = this.balance;
    const lv = this.levelCfg;

    this.elapsed = 0;
    this.mountainPeak = b.initialMountain;
    this.waterLevel = lv.initialWater ?? b.initialWater;
    this.combo = 0;
    this.maxCombo = 0;
    this.peakGap = this.safetyGap;
    this.isComboLocked = false;
    this.comboLockRemaining = 0;
    this.isBlinded = false;
    this.blindRemaining = 0;
    this.isFlashFlood = false;
    this.flashFloodRemaining = 0;
    this.missWaterBoostRemaining = 0;
    this.activeBeast = null;
    this.beastRemaining = 0;
    this.elephantStunRemaining = 0;
    this.score = 0;
    this.notesHit = 0;
    this.isVictory = false;
    this.isDefeat = false;
    this.lastHitResult = null;
    this.lastBeastTriggered = null;
    this.directorStress = 0;
    this.currentAct = 0;
    this.intensityPhase = 'calm';
    this.isCalmPhase = true;
    this.phaseWaterMul = 1;
    this.phaseBpmMul = 1;
    this.allowPoison = false;
    this.allowDisruptors = false;
    this.phaseChanged = false;
  }

  get sessionDuration() {
    return this.levelCfg.sessionDuration;
  }

  get acts() {
    return this.levelCfg.acts;
  }

  get safetyGap() {
    return this.mountainPeak - this.waterLevel;
  }

  get dangerRatio() {
    if (this.mountainPeak <= 0) return 1;
    return Math.min(1, Math.max(0, this.waterLevel / this.mountainPeak));
  }

  get gapRatio() {
    const maxGap = this.balance.initialMountain;
    return Math.max(0, Math.min(1, this.safetyGap / maxGap));
  }

  updateAct() {
    const acts = this.acts;
    for (let i = acts.length - 1; i >= 0; i--) {
      if (this.elapsed >= acts[i].start) {
        this.currentAct = i;
        return;
      }
    }
    this.currentAct = 0;
  }

  get actConfig() {
    return this.acts[this.currentAct] ?? this.acts[0];
  }

  get waterMultiplier() {
    let m = this.balance.actWaterMultipliers[this.currentAct] ?? 1;
    m *= this.levelCfg.waterRiseMul ?? 1;
    m *= this.phaseWaterMul ?? 1;
    if (this.isFlashFlood) m *= this.balance.flashFloodWaterBoost;
    if (this.missWaterBoostRemaining > 0) m *= this.balance.missWaterBoost;
    return m;
  }

  /**
   * @param {number} deltaGap
   */
  applyGapChange(deltaGap) {
    if (this.isComboLocked && deltaGap > 0) return;
    this.mountainPeak = Math.max(20, this.mountainPeak + deltaGap);
    if (this.safetyGap > this.peakGap) this.peakGap = this.safetyGap;
  }

  tickTimers(dt) {
    if (this.comboLockRemaining > 0) {
      this.comboLockRemaining -= dt;
      if (this.comboLockRemaining <= 0) {
        this.comboLockRemaining = 0;
        this.isComboLocked = false;
      }
    }
    if (this.blindRemaining > 0) {
      this.blindRemaining -= dt;
      if (this.blindRemaining <= 0) {
        this.blindRemaining = 0;
        this.isBlinded = false;
      }
    }
    if (this.flashFloodRemaining > 0) {
      this.flashFloodRemaining -= dt;
      if (this.flashFloodRemaining <= 0) {
        this.flashFloodRemaining = 0;
        this.isFlashFlood = false;
      }
    }
    if (this.missWaterBoostRemaining > 0) {
      this.missWaterBoostRemaining -= dt;
      if (this.missWaterBoostRemaining <= 0) this.missWaterBoostRemaining = 0;
    }
    if (this.beastRemaining > 0) {
      this.beastRemaining -= dt;
      if (this.beastRemaining <= 0) {
        this.beastRemaining = 0;
        this.activeBeast = null;
      }
    }
    if (this.elephantStunRemaining > 0) {
      this.elephantStunRemaining -= dt;
      if (this.elephantStunRemaining <= 0) this.elephantStunRemaining = 0;
    }
  }

  checkDefeat() {
    if (this.safetyGap <= 0) {
      this.isDefeat = true;
      return true;
    }
    return false;
  }

  checkVictory() {
    if (this.elapsed >= this.sessionDuration && this.safetyGap > 0) {
      this.isVictory = true;
      return true;
    }
    return false;
  }

  computeFinalScore() {
    const survived = Math.floor(this.elapsed);
    const gapBonus = Math.floor(this.peakGap);
    const levelBonus = this.gameLevel * 50;
    this.score = Math.max(1, survived * 10 + gapBonus + this.maxCombo + levelBonus);
    return this.score;
  }
}
