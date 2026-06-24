import Phaser from 'phaser';

/**
 * Mưa trút như thác — Level 2.
 */
export class RainView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   */
  constructor(scene, w, h) {
    this.scene = scene;
    this.drops = [];
    this.root = scene.add.container(0, 0).setDepth(1);

    const count = 90;
    for (let i = 0; i < count; i++) {
      const drop = scene.add.rectangle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(-h, h),
        Phaser.Math.FloatBetween(1, 2.5),
        Phaser.Math.Between(14, 28),
        0xaaddff,
        Phaser.Math.FloatBetween(0.25, 0.55)
      );
      drop.vy = Phaser.Math.Between(420, 680);
      drop.vx = Phaser.Math.FloatBetween(-18, -6);
      this.drops.push(drop);
      this.root.add(drop);
    }

    this.w = w;
    this.h = h;
    this.overlay = scene.add
      .rectangle(w / 2, h * 0.36, w, h * 0.72, 0x1a2a44, 0.12)
      .setDepth(0);
    this.root.add(this.overlay);
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    for (const d of this.drops) {
      d.y += d.vy * dt;
      d.x += d.vx * dt;
      if (d.y > this.h + 20) {
        d.y = Phaser.Math.Between(-40, -10);
        d.x = Phaser.Math.Between(0, this.w);
      }
      if (d.x < -10) d.x = this.w + 5;
    }
  }

  destroy() {
    this.root.destroy(true);
    this.drops = [];
  }
}
