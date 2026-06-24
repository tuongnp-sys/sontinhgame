import { GameState } from './GameState.js';
import { RhythmEngine } from './RhythmEngine.js';
import { FloodSystem } from './FloodSystem.js';
import { ComboSystem } from './ComboSystem.js';
import { DisruptorSystem } from './DisruptorSystem.js';
import { Director } from './Director.js';

/**
 * Điều phối toàn bộ logic trận đấu — GameScene chỉ gọi controller này.
 */
export class GameController {
  /**
   * @param {object} balance
   * @param {object} disruptorConfig
   * @param {number} [gameLevel]
   */
  constructor(balance, disruptorConfig, gameLevel = 1) {
    this.balance = balance;
    this.gameLevel = gameLevel;
    this.state = new GameState(balance);
    this.state.reset(gameLevel);
    this.rhythm = new RhythmEngine(balance);
    this.flood = new FloodSystem(balance);
    this.combo = new ComboSystem(balance);
    this.disruptor = new DisruptorSystem(balance);
    this.director = new Director(balance, disruptorConfig);
    this.forcePoisonNext = false;
    this.paused = false;
  }

  reset(gameLevel = 1) {
    this.gameLevel = gameLevel;
    this.state.reset(gameLevel);
    this.rhythm.reset();
    this.combo.reset();
    this.disruptor.reset();
    this.director.reset();
    this.forcePoisonNext = false;
    this.paused = false;
  }

  /**
   * @param {number} dt giây
   * @returns {{ended: boolean, victory: boolean, beast: string|null, event: object|null, phaseChanged: boolean}}
   */
  update(dt) {
    if (this.paused) {
      return { ended: false, victory: false, beast: null, event: null, phaseChanged: false, holdEvent: null };
    }

    const state = this.state;
    state.elapsed += dt;
    state.updateAct();
    state.tickTimers(dt);
    this.director.tick(dt);
    const phaseChanged = this.director.updatePhase(state);

    this.flood.tick(dt, state);
    this.disruptor.tick(dt, state);
    const holdEvent = this.rhythm.tick(dt, state, this.forcePoisonNext);
    this.forcePoisonNext = false;

    const beast = this.combo.checkMilestones(state);
    const event = this.director.evaluate(state, this.disruptor, this.flood);

    if (event?.type === 'poison_burst') {
      this.forcePoisonNext = true;
    }

    if (state.checkDefeat()) {
      state.computeFinalScore();
      return { ended: true, victory: false, beast, event, phaseChanged, holdEvent };
    }
    if (state.checkVictory()) {
      state.computeFinalScore();
      return { ended: true, victory: true, beast, event, phaseChanged, holdEvent };
    }

    return { ended: false, victory: false, beast, event, phaseChanged, holdEvent };
  }

  /** @returns {{result: string, note: object|null}} */
  handleTap() {
    return this.rhythm.tryHit(this.state);
  }

  /** @returns {{result: string, note: object|null}} */
  handleHoldRelease() {
    return this.rhythm.releaseHold(this.state);
  }

  setPaused(v) {
    this.paused = v;
  }
}
