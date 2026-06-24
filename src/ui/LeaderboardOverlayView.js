import Phaser from 'phaser';
import { createPillButton } from './phaserUi.js';
import { formatLeaderboardLines, getLeaderboard } from '../core/Leaderboard.js';

const SCROLL_PX_PER_SEC = 22;

/**
 * Full-screen leaderboard overlay — không bị che bởi nút menu.
 */
export class LeaderboardOverlayView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   * @param {() => void} onClose
   */
  constructor(scene, w, h, onClose) {
    this.scene = scene;
    this._scrollTween = null;

    this.root = scene.add.container(0, 0).setDepth(88);

    const backdrop = scene.add
      .rectangle(w / 2, h / 2, w, h, 0x0a1628, 0.72)
      .setInteractive();
    this.root.add(backdrop);

    const panelH = Math.min(h - 80, 420);
    const panelTop = h / 2 - panelH / 2;

    const panel = scene.add
      .rectangle(w / 2, h / 2, w - 20, panelH, 0xffffff, 0.97)
      .setStrokeStyle(3, 0xfdcb6e, 1);
    this.root.add(panel);

    const title = scene.add
      .text(w / 2, panelTop + 16, 'TOP RUNS', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#E17055',
      })
      .setOrigin(0.5, 0);
    this.root.add(title);

    const scrollTop = panelTop + 48;
    const scrollH = panelH - 100;
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(22, scrollTop, w - 44, scrollH);
    const mask = maskShape.createGeometryMask();

    const lines = formatLeaderboardLines(getLeaderboard());
    this.listText = scene.add
      .text(w / 2, scrollTop, lines.join('\n'), {
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        color: '#2D3436',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0)
      .setMask(mask);
    this.root.add(this.listText);

    this._scrollTop = scrollTop;
    this._scrollBottom = scrollTop + scrollH - 8;
    this._contentHeight = this.listText.height;

    this.closeBtn = createPillButton(scene, w / 2, panelTop + panelH - 36, 200, 44, 'CLOSE', () => {
      this.destroy();
      onClose();
    });
    this.closeBtn.setDepth(89);

    this._startScroll();
  }

  _startScroll() {
    const viewH = this._scrollBottom - this._scrollTop;
    if (this._contentHeight <= viewH) return;

    if (this._scrollTween) this._scrollTween.stop();
    const startY = this._scrollTop;
    const endY = this._scrollTop - (this._contentHeight - viewH);
    this.listText.y = startY;

    const duration = Math.max(8000, ((this._contentHeight - viewH) / SCROLL_PX_PER_SEC) * 1000);
    this._scrollTween = this.scene.tweens.add({
      targets: this.listText,
      y: endY,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.listText.y = startY;
        this._startScroll();
      },
    });
  }

  destroy() {
    if (this._scrollTween) this._scrollTween.stop();
    this.closeBtn?.destroy(true);
    this.root?.destroy(true);
  }
}
