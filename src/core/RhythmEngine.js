/** @typedef {import('./GameState.js').GameState} GameState */

const NOTE_TYPES = ['earth', 'earth', 'earth', 'wood', 'fire'];

let noteIdCounter = 0;

/**
 * Nốt rơi dọc về vùng vàng giữa màn hình (Magic Tiles style).
 */
export class RhythmEngine {
  /**
   * @param {object} balance
   */
  constructor(balance) {
    this.balance = balance;
    /** @type {Array<{id:number,x:number,y:number,type:string,resolved:boolean,holding?:boolean}>} */
    this.notes = [];
    this.spawnTimer = 0;
    this.hitZoneX = 187;
    this.hitZoneY = 560;
    this.laneSpawnY = 300;
    this.laneMissY = 640;
    this.screenWidth = 375;
    /** @type {{ note: object, elapsed: number, gapAcc: number, initialResult: string }|null} */
    this.holdState = null;
  }

  reset() {
    noteIdCounter = 0;
    this.notes = [];
    this.spawnTimer = 0;
    this.holdState = null;
  }

  /**
   * @param {number} dt
   * @param {GameState} state
   * @param {boolean} forcePoison
   * @returns {{ result: string, note: object|null }|null}
   */
  tick(dt, state, forcePoison = false) {
    const bpm = state.actConfig.bpm * state.phaseBpmMul;
    const interval = 60 / bpm;
    this.spawnTimer += dt;

    while (this.spawnTimer >= interval) {
      this.spawnTimer -= interval;
      this._spawnNote(state, forcePoison);
    }

    const holdEvent = this.tickHold(dt, state);

    const b = this.balance;
    const lv = state.levelCfg;
    const speed = b.noteSpeed * (bpm / 80) * (lv.noteSpeedMul ?? 1);
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      if (note.resolved || note.holding) continue;
      note.y += speed * dt;
      if (note.y > this.laneMissY) {
        if (note.type !== 'poison' && !state.isComboLocked) {
          state.combo = 0;
          state.applyGapChange(b.missGap);
          state.missWaterBoostRemaining = b.missWaterBoostDuration;
          state.lastHitResult = 'miss';
        }
        this.notes.splice(i, 1);
      }
    }

    return holdEvent;
  }

  /**
   * @param {number} dt
   * @param {GameState} state
   * @returns {{ result: string, note: object|null }|null}
   */
  tickHold(dt, state) {
    if (!this.holdState) return null;

    const b = this.balance;
    const hs = this.holdState;
    hs.elapsed += dt;
    hs.note.y = this.hitZoneY;

    if (!state.isComboLocked) {
      const gap = b.holdGapPerSecond * dt;
      state.applyGapChange(gap);
      hs.gapAcc += gap;
    }

    const maxHold = b.holdMaxSeconds ?? 1.8;
    if (hs.elapsed >= maxHold) {
      return this._finishHold(state, 'hold_complete');
    }
    return null;
  }

  /**
   * @param {GameState} state
   * @param {boolean} forcePoison
   */
  _spawnNote(state, forcePoison) {
    let type;
    const canPoison = state.allowPoison && !state.isCalmPhase;
    if (canPoison && (forcePoison || Math.random() < (state.levelCfg.poisonSpawnChance ?? this.balance.poisonSpawnChance))) {
      type = 'poison';
    } else if (state.currentAct >= 2 && !state.isCalmPhase && Math.random() < 0.1) {
      type = 'hold';
    } else {
      type = NOTE_TYPES[Math.floor(Math.random() * NOTE_TYPES.length)];
    }

    this.notes.push({
      id: ++noteIdCounter,
      x: this.hitZoneX,
      y: this.laneSpawnY,
      type,
      resolved: false,
    });
  }

  /**
   * @param {GameState} state
   * @returns {{ result: string, note: object|null }}
   */
  tryHit(state) {
    if (this.holdState) {
      return { result: 'ignore', note: this.holdState.note };
    }

    const b = this.balance;
    let best = null;
    let bestDist = Infinity;

    for (const note of this.notes) {
      if (note.resolved || note.holding) continue;
      const dist = Math.abs(note.y - this.hitZoneY);
      if (dist < bestDist) {
        bestDist = dist;
        best = note;
      }
    }

    const lv = state.levelCfg;
    const hitGood = lv.hitWindowGood ?? b.hitWindowGood;
    const hitPerfect = lv.hitWindowPerfect ?? b.hitWindowPerfect;
    const hitGreat = lv.hitWindowGreat ?? b.hitWindowGreat;

    if (!best || bestDist > hitGood) {
      if (!state.isCalmPhase) {
        state.applyGapChange(b.missGap * 0.35);
        state.combo = 0;
        state.missWaterBoostRemaining = b.missWaterBoostDuration;
      }
      state.lastHitResult = 'miss';
      return { result: 'miss', note: null };
    }

    if (best.type === 'poison') {
      return this._resolvePoison(best, state);
    }

    let result = 'miss';
    if (bestDist <= hitPerfect) result = 'perfect';
    else if (bestDist <= hitGreat) result = 'great';
    else if (bestDist <= hitGood) result = 'good';

    if (best.type === 'hold') {
      if (result === 'miss') {
        state.combo = 0;
        if (!state.isCalmPhase) state.missWaterBoostRemaining = b.missWaterBoostDuration;
        state.lastHitResult = 'miss';
        return { result: 'miss', note: best };
      }
      return this._startHold(best, state, result);
    }

    return this._resolveNormalHit(best, state, result);
  }

  /**
   * @param {GameState} state
   * @returns {{ result: string, note: object|null }}
   */
  releaseHold(state) {
    if (!this.holdState) {
      return { result: 'ignore', note: null };
    }

    const minHold = this.balance.holdMinSeconds ?? 0.12;
    if (this.holdState.elapsed < minHold) {
      return this._finishHold(state, 'miss');
    }
    return this._finishHold(state, 'hold_complete');
  }

  /**
   * @param {object} note
   * @param {GameState} state
   * @param {string} initialResult
   */
  _startHold(note, state, initialResult) {
    if (state.isComboLocked) {
      state.lastHitResult = 'locked';
      return { result: 'locked', note };
    }

    const b = this.balance;
    let gap = 0;
    if (initialResult === 'perfect') gap = b.perfectGap;
    else if (initialResult === 'great') gap = b.greatGap;
    else if (initialResult === 'good') gap = b.goodGap;

    if (gap > 0) {
      state.applyGapChange(gap);
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      state.notesHit++;
    }

    note.holding = true;
    note.y = this.hitZoneY;
    this.holdState = { note, elapsed: 0, gapAcc: gap, initialResult };
    state.lastHitResult = 'hold_start';
    return { result: 'hold_start', note };
  }

  /**
   * @param {GameState} state
   * @param {string} result
   */
  _finishHold(state, result) {
    const hs = this.holdState;
    if (!hs) {
      return { result: 'ignore', note: null };
    }

    const note = hs.note;
    note.resolved = true;
    note.holding = false;
    const idx = this.notes.indexOf(note);
    if (idx >= 0) this.notes.splice(idx, 1);
    this.holdState = null;

    if (result === 'miss') {
      state.combo = 0;
      if (!state.isCalmPhase) {
        state.applyGapChange(this.balance.missGap);
        state.missWaterBoostRemaining = this.balance.missWaterBoostDuration;
      }
    } else if (hs.gapAcc > 0 && result === 'hold_complete') {
      state.notesHit++;
    }

    state.lastHitResult = result;
    return { result, note };
  }

  /**
   * @param {object} note
   * @param {GameState} state
   */
  _resolvePoison(note, state) {
    const b = this.balance;
    note.resolved = true;
    const idx = this.notes.indexOf(note);
    if (idx >= 0) this.notes.splice(idx, 1);
    state.combo = 0;
    state.isComboLocked = true;
    state.comboLockRemaining = b.poisonComboLockMs / 1000;
    state.applyGapChange(-b.poisonGapPenalty);
    state.lastHitResult = 'poison_hit';
    return { result: 'poison_hit', note };
  }

  /**
   * @param {object} note
   * @param {GameState} state
   * @param {string} result
   */
  _resolveNormalHit(note, state, result) {
    const b = this.balance;
    note.resolved = true;
    const idx = this.notes.indexOf(note);
    if (idx >= 0) this.notes.splice(idx, 1);

    if (state.isComboLocked) {
      state.lastHitResult = 'locked';
      return { result: 'locked', note };
    }

    let gap = 0;
    if (result === 'perfect') gap = b.perfectGap;
    else if (result === 'great') gap = b.greatGap;
    else if (result === 'good') gap = b.goodGap;
    else {
      gap = state.isCalmPhase ? b.missGap * 0.5 : b.missGap;
      state.combo = 0;
      if (!state.isCalmPhase) state.missWaterBoostRemaining = b.missWaterBoostDuration;
    }

    if (gap > 0) {
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      state.notesHit++;
    }

    if (note.type === 'wood') gap += 2;
    if (note.type === 'fire') gap += 1;

    state.applyGapChange(gap);
    state.lastHitResult = result;
    return { result, note };
  }

  getActiveNotes() {
    return this.notes.filter((n) => !n.resolved);
  }

  isHolding() {
    return this.holdState != null;
  }
}
