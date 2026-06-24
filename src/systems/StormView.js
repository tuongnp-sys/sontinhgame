import Phaser from 'phaser';

/**
 * Mưa bão — intensity 1 = L2, 2 = Level Max.
 */
export class StormView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   * @param {number} [intensity]
   */
  constructor(scene, w, h, intensity = 1) {
    this.scene = scene;
    this.drops = [];
    this.intensity = intensity;
    this.root = scene.add.container(0, 0).setDepth(14);

    const count = intensity >= 2 ? 180 : 90;
    const overlayAlpha = intensity >= 2 ? 0.28 : 0.12;
    const color = intensity >= 2 ? 0x8899bb : 0xaaddff;

    for (let i = 0; i < count; i++) {
      const drop = scene.add.rectangle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(-h, h),
        Phaser.Math.FloatBetween(1, intensity >= 2 ? 3.5 : 2.5),
        Phaser.Math.Between(14, intensity >= 2 ? 36 : 28),
        color,
        Phaser.Math.FloatBetween(0.25, intensity >= 2 ? 0.7 : 0.55)
      );
      drop.vy = Phaser.Math.Between(intensity >= 2 ? 520 : 420, intensity >= 2 ? 820 : 680);
      drop.vx = Phaser.Math.FloatBetween(intensity >= 2 ? -28 : -18, intensity >= 2 ? -8 : -6);
      this.drops.push(drop);
      this.root.add(drop);
    }

    this.w = w;
    this.h = h;
    this.overlay = scene.add
      .rectangle(w / 2, h * 0.36, w, h * 0.72, 0x0a1428, overlayAlpha)
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
