import Phaser from 'phaser';

/**
 * Ngoc Hoa cries, sheds tears, and waves goodbye when Son Tinh loses.
 * Supports live battlefield sprites or standalone cinematic sprites on GameOver overlay.
 */
export class NgocHoaFarewellView {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.GameObjects.Image | { x?: number, y?: number, depth?: number, scale?: number, large?: boolean }} miImgOrOpts
   * @param {Phaser.GameObjects.Image} [heroSprite]
   */
  constructor(scene, miImgOrOpts, heroSprite) {
    this.scene = scene;
    this._tearTimer = null;
    this._ownsSprites = false;
    this._miImg = null;
    this._heroImg = null;

    const isOpts =
      miImgOrOpts &&
      typeof miImgOrOpts === 'object' &&
      !('texture' in miImgOrOpts) &&
      !('setFlipX' in miImgOrOpts);

    let depth = 12;
    let large = false;

    if (isOpts) {
      const opts = miImgOrOpts;
      const w = scene.cameras.main.width;
      const h = scene.cameras.main.height;
      const cx = opts.x ?? w * 0.55;
      const cy = opts.y ?? h * 0.33;
      const scale = opts.scale ?? 1.55;
      depth = opts.depth ?? 48;
      large = opts.large !== false;

      this._ownsSprites = true;
      this._heroImg = scene.add
        .image(cx - 78, cy + 24, 'game_assets', 'hero_sontinh')
        .setOrigin(0.5, 1)
        .setScale(scale * 1.05)
        .setDepth(depth - 1);
      this._miImg = scene.add
        .image(cx, cy, 'game_assets', 'hero_minuong')
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setDepth(depth);
    } else {
      this._miImg = miImgOrOpts;
      this._heroImg = heroSprite;
      large = false;
    }

    this.root = scene.add.container(0, 0).setDepth(depth);

    const miImg = this._miImg;
    const heroImg = this._heroImg;

    if (large) {
      const glow = scene.add
        .ellipse(miImg.x, miImg.y - 40, 120, 90, 0xfff8e7, 0.35)
        .setDepth(depth - 2);
      this.root.add(glow);
      scene.tweens.add({
        targets: glow,
        alpha: { from: 0.25, to: 0.5 },
        scaleX: { from: 0.95, to: 1.08 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    miImg.setFlipX(true);

    scene.tweens.add({
      targets: miImg,
      angle: { from: large ? -14 : -10, to: large ? 14 : 10 },
      duration: large ? 480 : 420,
      yoyo: true,
      repeat: large ? 8 : 5,
      ease: 'Sine.easeInOut',
    });

    scene.tweens.add({
      targets: heroImg,
      alpha: large ? 0.55 : 0.35,
      y: heroImg.y + (large ? 18 : 28),
      duration: large ? 2800 : 2200,
      ease: 'Quad.easeIn',
    });

    const tearY = miImg.y - (large ? 72 : 52);
    this._spawnTear(miImg.x - (large ? 10 : 6), tearY, large);
    this._spawnTear(miImg.x + (large ? 12 : 8), tearY + 4, large);
    this._tearTimer = scene.time.addEvent({
      delay: large ? 320 : 380,
      repeat: large ? 12 : 5,
      callback: () => {
        if (!miImg.active) return;
        this._spawnTear(
          miImg.x + Phaser.Math.Between(large ? -14 : -10, large ? 14 : 10),
          miImg.y - (large ? 70 : 50),
          large
        );
      },
    });

    const waveSize = large ? '36px' : '20px';
    const wave = scene.add
      .text(miImg.x - (large ? 36 : 22), miImg.y - (large ? 100 : 70), '👋', {
        fontSize: waveSize,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.root.add(wave);
    scene.tweens.add({
      targets: wave,
      alpha: 1,
      y: wave.y - (large ? 18 : 12),
      duration: 500,
      yoyo: true,
      repeat: large ? 6 : 4,
      ease: 'Sine.easeOut',
    });

    if (large) {
      const caption = scene.add
        .text(miImg.x, miImg.y - (large ? 118 : 90), 'Ngoc Hoa waves goodbye…', {
          fontFamily: 'system-ui, Georgia, serif',
          fontSize: '13px',
          fontStyle: 'bold italic',
          color: '#FFEAA7',
        })
        .setOrigin(0.5, 1)
        .setAlpha(0)
        .setShadow(1, 1, '#0a1628', 4, true, true);
      this.root.add(caption);
      scene.tweens.add({
        targets: caption,
        alpha: 1,
        duration: 700,
        delay: 400,
        ease: 'Sine.easeOut',
      });
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {boolean} [large]
   */
  _spawnTear(x, y, large = false) {
    const r = large ? 4.5 : 2.5;
    const fall = large ? 32 : 22;
    const tear = this.scene.add.circle(x, y, r, 0x48dbfb, 0.9);
    this.root.add(tear);
    this.scene.tweens.add({
      targets: tear,
      y: y + fall,
      alpha: 0,
      duration: large ? 850 : 700,
      ease: 'Quad.easeIn',
      onComplete: () => tear.destroy(),
    });
  }

  destroy() {
    this._tearTimer?.remove();
    if (this._ownsSprites) {
      this._heroImg?.destroy();
      this._miImg?.destroy();
    }
    this.root?.destroy(true);
  }
}
