import Phaser from 'phaser';

/**
 * Sấm chớp trên bầu trời — Level Max.
 */
export class LightningView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   */
  constructor(scene, w, h) {
    this.scene = scene;
    this.w = w;
    this.h = h;
    this.root = scene.add.container(0, 0).setDepth(16);

    this.bolt = scene.add.graphics().setAlpha(0);
    this.root.add(this.bolt);

    this._scheduleNext();
  }

  _scheduleNext() {
    const delay = Phaser.Math.Between(3500, 7500);
    this.scene.time.delayedCall(delay, () => this._strike());
  }

  _strike() {
    if (!this.root?.active) return;

    const x = Phaser.Math.Between(this.w * 0.15, this.w * 0.85);
    this.bolt.clear();
    this.bolt.lineStyle(3, 0xe8f4ff, 0.95);
    this.bolt.fillStyle(0xffffff, 0.85);

    let px = x;
    let py = 0;
    this.bolt.beginPath();
    this.bolt.moveTo(px, py);
    for (let i = 0; i < 6; i++) {
      px += Phaser.Math.Between(-28, 28);
      py += Phaser.Math.Between(28, 55);
      this.bolt.lineTo(px, py);
    }
    this.bolt.strokePath();

    this.bolt.setAlpha(1);
    this.scene.cameras.main.flash(100, 220, 230, 255);
    this.scene.cameras.main.shake(120, 0.008);

    this.scene.time.delayedCall(80, () => {
      if (this.bolt?.active) this.bolt.setAlpha(0);
    });

    this._scheduleNext();
  }

  destroy() {
    this.root?.destroy(true);
  }
}
