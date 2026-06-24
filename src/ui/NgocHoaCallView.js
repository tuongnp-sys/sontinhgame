import Phaser from 'phaser';

const CRY_LINE = 'I cannot lose Ngoc Hoa!';

/**
 * After losing L2 — Son Tinh cries out for Ngoc Hoa, begging final stand.
 */
export class NgocHoaCallView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   * @param {{ panelY?: number }} [opts]
   */
  constructor(scene, w, h, opts = {}) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(50);

    const panelY = opts.panelY ?? h * 0.5;
    const panelW = w - 40;
    const panelH = 175;

    const frame = scene.add
      .rectangle(w / 2, panelY, panelW, panelH, 0x1a0a0a, 0.92)
      .setStrokeStyle(3, 0xe74c3c, 0.95);
    this.root.add(frame);

    const inner = scene.add
      .rectangle(w / 2, panelY, panelW - 8, panelH - 8, 0xfff8e7, 0.97)
      .setStrokeStyle(2, 0xf1c40f, 0.8);
    this.root.add(inner);

    const header = scene.add
      .text(w / 2, panelY - panelH / 2 + 14, 'SON TINH CRIES OUT!', {
        fontFamily: 'system-ui, Georgia, serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#C0392B',
      })
      .setOrigin(0.5, 0);
    this.root.add(header);

    const sub = scene.add
      .text(w / 2, panelY - panelH / 2 + 34, 'He cannot let Ngoc Hoa go', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#636E72',
      })
      .setOrigin(0.5, 0);
    this.root.add(sub);

    const body = scene.add
      .text(w / 2, panelY + 8, `${CRY_LINE}\n${CRY_LINE}\n${CRY_LINE}`, {
        fontFamily: 'Georgia, system-ui, serif',
        fontSize: '16px',
        fontStyle: 'bold italic',
        color: '#1B7F4A',
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.root.add(body);

    scene.tweens.add({
      targets: body,
      alpha: 1,
      scale: { from: 0.92, to: 1 },
      duration: 600,
      ease: 'Back.easeOut',
    });

    scene.tweens.add({
      targets: body,
      scale: 1.04,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600,
    });
  }

  destroy() {
    this.root?.destroy(true);
  }
}
