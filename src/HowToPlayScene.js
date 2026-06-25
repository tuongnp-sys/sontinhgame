import Phaser from 'phaser';
import { audioManager } from './audio/AudioManager.js';
import { bgmController } from './audio/BgmController.js';
import { SceneryView } from './systems/SceneryView.js';
import { createMuteToggle } from './ui/MuteToggle.js';
import { HowToPlayPanel } from './ui/HowToPlayPanel.js';
import { getExpandCropInsets, safeTop, safeRightX } from './ui/safeHud.js';

/**
 * HowToPlayScene — bilingual guide + back + mute.
 */
export class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super('HowToPlayScene');
  }

  init(data) {
    this.autoStart = data.autoStart ?? false;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.scenery = new SceneryView(this, w, h, h * 0.75);

    const insets = getExpandCropInsets(this.scale);
    const topY = safeTop(28, insets);
    const muteX = safeRightX(22, w, insets);

    this._buildBackButton(w, topY);
    this.muteToggle = createMuteToggle(this, muteX, topY, 30);

    this.panel = new HowToPlayPanel(this, w, h, {
      autoStart: this.autoStart,
      onBack: () => this.scene.start('MenuScene'),
      onStart: () => this._goPlay(),
    });

    bgmController.play(this, 'menu');
  }

  /**
   * @param {number} w
   * @param {number} topY
   */
  _buildBackButton(w, topY) {
    const y = topY;
    this.backBg = this.add
      .rectangle(52, y, 88, 32, 0xffffff, 0.88)
      .setStrokeStyle(2, 0xe17055, 0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(30);

    this.backLabel = this.add
      .text(52, y, '← BACK', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#C0392B',
      })
      .setOrigin(0.5)
      .setDepth(31);

    const goBack = () => this.scene.start('MenuScene');
    this.backBg.on('pointerdown', goBack);
    this.backLabel.setInteractive({ useHandCursor: true });
    this.backLabel.on('pointerdown', goBack);
    this.backBg.on('pointerover', () => this.backBg.setFillStyle(0xffffff, 1));
    this.backBg.on('pointerout', () => this.backBg.setFillStyle(0xffffff, 0.88));
  }

  async _goPlay() {
    await audioManager.unlock({ proceduralMusic: !bgmController.isTrackReady('gameplay') });
    if (this.sound.context?.state === 'suspended') {
      await this.sound.context.resume();
    }
    this.scene.start('GameScene', { fromMenu: true });
  }

  update(_t, delta) {
    if (this.scenery) this.scenery.update(delta / 1000, 0);
  }

  shutdown() {
    this.panel?.destroy();
    this.panel = null;
    this.scenery?.destroy();
    if (!this.scene.isActive('MenuScene')) bgmController.stop();
  }
}
