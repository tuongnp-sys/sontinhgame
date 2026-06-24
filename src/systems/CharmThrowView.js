import Phaser from 'phaser';

const CHARM_COLORS = [0xf1c40f, 0xe74c3c, 0x9b59b6, 0x48dbfb, 0x2ecc71, 0xff88aa, 0xffa502];

/**
 * Bùa bối đủ màu — Sơn Tinh / Thủy Tinh tung về điểm spawn binh.
 */
export class CharmThrowView {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(13);
  }

  /**
   * @param {number} fromX
   * @param {number} fromY
   * @param {number} toX
   * @param {number} toY
   * @param {'hero'|'boss'} side
   */
  throwCharms(fromX, fromY, toX, toY, side) {
    const count = Phaser.Math.Between(3, 5);
    const spread = side === 'hero' ? -1 : 1;

    for (let i = 0; i < count; i++) {
      const color = Phaser.Utils.Array.GetRandom(CHARM_COLORS);
      const charm = this.scene.add
        .rectangle(fromX, fromY, 6, 10, color, 0.9)
        .setAngle(Phaser.Math.Between(-30, 30));
      this.root.add(charm);

      const arcX = (fromX + toX) / 2 + spread * Phaser.Math.Between(24, 56);
      const arcY = Math.min(fromY, toY) - Phaser.Math.Between(40, 90);

      this.scene.tweens.add({
        targets: charm,
        x: arcX,
        y: arcY,
        duration: 160,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: charm,
            x: toX + Phaser.Math.Between(-10, 10),
            y: toY,
            scaleX: 0.3,
            scaleY: 0.3,
            alpha: 0,
            duration: 200,
            ease: 'Quad.easeIn',
            onComplete: () => charm.destroy(),
          });
        },
      });
    }
  }

  /**
   * @param {Phaser.GameObjects.Image} actor
   */
  playThrowPose(actor) {
    if (!actor?.active) return;
    this.scene.tweens.add({
      targets: actor,
      scaleX: actor.scaleX * 1.12,
      scaleY: actor.scaleY * 0.92,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  destroy() {
    this.root?.destroy(true);
  }
}
