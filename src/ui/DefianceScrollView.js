import Phaser from 'phaser';

const SCROLL_PX_PER_SEC = 18;
const DEFIANCE_LINE = 'I will not accept defeat!';

/**
 * After Son Tinh wins L1 — Thuy Tinh defies and challenges a rematch.
 */
export class DefianceScrollView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   * @param {{ panelY?: number }} [opts]
   */
  constructor(scene, w, h, opts = {}) {
    this.scene = scene;
    this.w = w;
    this.h = h;
    this._scrollTween = null;

    this.root = scene.add.container(0, 0).setDepth(50);

    const panelY = opts.panelY ?? h * 0.47;
    const panelW = w - 40;
    const panelH = 200;

    const scrollBg = scene.add
      .rectangle(w / 2, panelY, panelW, 8, 0xf5e6c8, 1)
      .setStrokeStyle(2, 0xc9a66b, 1);
    this.root.add(scrollBg);

    scene.tweens.add({
      targets: scrollBg,
      displayHeight: panelH,
      duration: 1100,
      ease: 'Sine.easeOut',
      onComplete: () => this._buildScrollContent(panelY, panelW, panelH),
    });
  }

  /**
   * @param {number} panelY
   * @param {number} panelW
   * @param {number} panelH
   */
  _buildScrollContent(panelY, panelW, panelH) {
    const frameTop = panelY - panelH / 2;
    const frameBottom = panelY + panelH / 2;

    const parchment = this.scene.add
      .rectangle(this.w / 2, panelY, panelW, panelH, 0xfff8e7, 0.97)
      .setStrokeStyle(3, 0xc9a66b, 1);
    this.root.add(parchment);

    const header = this.scene.add
      .text(this.w / 2, frameTop + 16, 'THUY TINH WILL NOT YIELD!', {
        fontFamily: 'system-ui, Georgia, serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#2980B9',
      })
      .setOrigin(0.5, 0);
    this.root.add(header);

    const sub = this.scene.add
      .text(this.w / 2, frameTop + 36, 'THUY TINH SENDS A CHALLENGE!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#E67E22',
      })
      .setOrigin(0.5, 0);
    this.root.add(sub);

    this.scene.tweens.add({
      targets: sub,
      alpha: { from: 1, to: 0.35 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const maskShape = this.scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(this.w / 2 - panelW / 2 + 10, frameTop + 58, panelW - 20, panelH - 72);
    const mask = maskShape.createGeometryMask();

    const body = Array(16).fill(DEFIANCE_LINE).join('\n');
    this.scrollText = this.scene.add
      .text(this.w / 2, frameBottom - 10, body, {
        fontFamily: 'Georgia, system-ui, serif',
        fontSize: '15px',
        fontStyle: 'bold italic',
        color: '#C0392B',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0)
      .setMask(mask);

    this.root.add(this.scrollText);
    this._frameTop = frameTop + 58;
    this._frameBottom = frameBottom - 12;
    this._startScroll();
  }

  _startScroll() {
    if (this._scrollTween) this._scrollTween.stop();
    const startY = this._frameBottom;
    const endY = this._frameTop - this.scrollText.height;
    this.scrollText.y = startY;
    const duration = Math.max(6000, ((startY - endY) / SCROLL_PX_PER_SEC) * 1000);

    this._scrollTween = this.scene.tweens.add({
      targets: this.scrollText,
      y: endY,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.scrollText.y = startY;
        this._startScroll();
      },
    });
  }

  destroy() {
    if (this._scrollTween) this._scrollTween.stop();
    this.root.destroy(true);
  }
}
