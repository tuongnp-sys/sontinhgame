import Phaser from 'phaser';

const SCROLL_PX_PER_SEC = 16;
const SUBMISSION_LINE = 'I submit from heart and word!';

const AUTHOR_COPY = {
  thuy_tinh: {
    header: 'THUY TINH SUBMITS!',
    sub: 'Thuy Tinh sends words of surrender',
    headerColor: '#2980B9',
    bodyColor: '#1B7F4A',
    parchment: 0xfff8e7,
    stroke: 0xc9a66b,
  },
  son_tinh: {
    header: 'SON TINH SUBMITS!',
    sub: 'Son Tinh sends words of surrender',
    headerColor: '#1B7F4A',
    bodyColor: '#C0392B',
    parchment: 0xfff8e7,
    stroke: 0xf1c40f,
  },
};

/**
 * Submission scroll — Level Max and Level 2 victory.
 */
export class SubmissionScrollView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   * @param {{ panelY?: number, author?: 'thuy_tinh'|'son_tinh', compact?: boolean }} [opts]
   */
  constructor(scene, w, h, opts = {}) {
    this.scene = scene;
    this.w = w;
    this.h = h;
    this.author = opts.author ?? 'thuy_tinh';
    this.compact = opts.compact ?? false;
    this.copy = AUTHOR_COPY[this.author];
    this._scrollTween = null;

    this.root = scene.add.container(0, 0).setDepth(50);

    const panelY = opts.panelY ?? h * 0.47;
    const panelW = w - 40;
    const panelH = this.compact ? 130 : 195;

    const scrollBg = scene.add
      .rectangle(w / 2, panelY, panelW, 8, 0xf5e6c8, 1)
      .setStrokeStyle(2, this.copy.stroke, 1);
    this.root.add(scrollBg);

    scene.tweens.add({
      targets: scrollBg,
      displayHeight: panelH,
      duration: this.compact ? 800 : 1100,
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
      .rectangle(this.w / 2, panelY, panelW, panelH, this.copy.parchment, 0.97)
      .setStrokeStyle(3, this.copy.stroke, 1);
    this.root.add(parchment);

    const header = this.scene.add
      .text(this.w / 2, frameTop + 12, this.copy.header, {
        fontFamily: 'system-ui, Georgia, serif',
        fontSize: this.compact ? '12px' : '14px',
        fontStyle: 'bold',
        color: this.copy.headerColor,
      })
      .setOrigin(0.5, 0);
    this.root.add(header);

    const sub = this.scene.add
      .text(this.w / 2, frameTop + (this.compact ? 28 : 34), this.copy.sub, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: this.compact ? '10px' : '11px',
        color: '#636E72',
      })
      .setOrigin(0.5, 0);
    this.root.add(sub);

    const bodyTop = frameTop + (this.compact ? 44 : 58);
    const bodyH = panelH - (this.compact ? 52 : 72);
    const maskShape = this.scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(this.w / 2 - panelW / 2 + 10, bodyTop, panelW - 20, bodyH);
    const mask = maskShape.createGeometryMask();

    const lines = this.compact ? 8 : 14;
    const body = Array(lines).fill(SUBMISSION_LINE).join('\n');
    this.scrollText = this.scene.add
      .text(this.w / 2, frameBottom - 8, body, {
        fontFamily: 'Georgia, system-ui, serif',
        fontSize: this.compact ? '13px' : '15px',
        fontStyle: 'bold italic',
        color: this.copy.bodyColor,
        align: 'center',
        lineSpacing: this.compact ? 8 : 10,
      })
      .setOrigin(0.5, 0)
      .setMask(mask);

    this.root.add(this.scrollText);
    this._frameTop = bodyTop;
    this._frameBottom = frameBottom - 10;
    this._startScroll();
  }

  _startScroll() {
    if (this._scrollTween) this._scrollTween.stop();
    const startY = this._frameBottom;
    const endY = this._frameTop - this.scrollText.height;
    this.scrollText.y = startY;
    const duration = Math.max(5000, ((startY - endY) / SCROLL_PX_PER_SEC) * 1000);

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
