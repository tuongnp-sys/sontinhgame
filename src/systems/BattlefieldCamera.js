import Phaser from 'phaser';
import balance from '../data/balance.json';

/**
 * Khung hình chiến trường — pan mượt theo thế trận, không nhảy cứng.
 */
export class BattlefieldCamera {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {Phaser.GameObjects.Container} battlefieldRoot
   * @param {{ sonX: number, miX: number, thuyX: number }} anchors
   */
  constructor(scene, w, battlefieldRoot, anchors) {
    this.scene = scene;
    this.w = w;
    this.battlefieldRoot = battlefieldRoot;
    this.sonX = anchors.sonX;
    this.miX = anchors.miX;
    this.thuyX = anchors.thuyX;
    this.panX = 0;
    this.targetPanX = 0;
    this.processionSeconds = balance.storyProcessionSeconds ?? 14;
  }

  /**
   * @param {import('../core/GameState.js').GameState} state
   * @param {number} dt
   */
  update(state, dt) {
    const danger = state.dangerRatio;
    const gapRatio = state.gapRatio;
    const elapsed = state.elapsed;

    if (elapsed < this.processionSeconds) {
      const t = elapsed / this.processionSeconds;
      const focusX = Phaser.Math.Linear(this.sonX + 30, this.miX, t * 0.25);
      this.targetPanX = (focusX - this.w / 2) * -0.32;
    } else {
      const blendOut = Math.min(1, (elapsed - this.processionSeconds) / 4);
      const sonWeight = (1 - danger) * (0.6 + gapRatio * 0.4);
      const thuyWeight = danger * (0.8 + (1 - gapRatio) * 0.2);
      const miWeight = 0.2;
      const total = sonWeight + thuyWeight + miWeight;
      const focusX =
        (this.sonX * sonWeight + this.thuyX * thuyWeight + this.miX * miWeight) / total;
      const processionPan = (this.sonX + 30 - this.w / 2) * -0.32;
      const combatPan = (focusX - this.w / 2) * -0.38;
      this.targetPanX = Phaser.Math.Linear(processionPan, combatPan, blendOut);
    }

    const smooth = Math.min(1, 5 * dt);
    this.panX = Phaser.Math.Linear(this.panX, this.targetPanX, smooth);
    this.battlefieldRoot.x = this.panX;
  }

  /**
   * Vị trí X mượt của Ngọc Hoa — từ cạnh Sơn Tinh dần về giữa khi nguy hiểm.
   * @param {import('../core/GameState.js').GameState} state
   * @param {number} peakY
   * @param {number} waterSurfaceY
   * @returns {{ x: number, y: number, besideSon: boolean }}
   */
  getMiPosition(state, peakY, waterSurfaceY) {
    const besideX = this.sonX + 38;
    const centerX = this.miX;
    const elapsed = state.elapsed;
    const procession = elapsed < this.processionSeconds;

    if (procession) {
      const t = elapsed / this.processionSeconds;
      const lateBlend = Math.max(0, (t - 0.65) / 0.35);
      const x = Phaser.Math.Linear(besideX, besideX + 18, lateBlend);
      return { x, y: peakY - 4, besideSon: true };
    }

    const exitBlend = Math.min(1, (elapsed - this.processionSeconds) / 3.5);
    const dangerPull = 1 - state.gapRatio;
    const pull = Math.min(1, exitBlend * 0.55 + dangerPull * 0.65);
    const x = Phaser.Math.Linear(besideX, centerX, pull);
    const y = Phaser.Math.Linear(peakY - 4, waterSurfaceY - 2, Math.min(1, exitBlend * 0.7));
    return { x, y, besideSon: pull < 0.35 };
  }

  reset() {
    this.panX = 0;
    this.targetPanX = 0;
    this.battlefieldRoot.x = 0;
  }
}
