import Phaser from 'phaser';
import { audioManager } from './audio/AudioManager.js';
import { bgmController } from './audio/BgmController.js';
import { SceneryView } from './systems/SceneryView.js';
import { createArcadeTitle, createPillButton } from './ui/phaserUi.js';

/**
 * HowToPlayScene — hướng dẫn đồng bộ với mechanics thực tế.
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

    this.add
      .rectangle(w / 2, h / 2, w - 20, h * 0.68, 0xffffff, 0.88)
      .setStrokeStyle(3, 0xfdcb6e);

    createArcadeTitle(this, w / 2, 58, 'HOW TO PLAY', null);

    const lines = [
      'GOAL — Water rises constantly. Keep the mountain',
      'above the flood to protect Princess Ngoc Hoa!',
      '',
      'RHYTHM — TAP notes at the golden ring:',
      '  Gold = raise mountain',
      '  Brown = bonus height (+extra)',
      '  Orange = attack (+small boost)',
      '  Purple = HOLD: press & keep finger down!',
      '  Green (X) = POISON — do NOT tap!',
      '',
      'BALANCE BAR (below ring):',
      '  Red S = Son Tinh | Blue T = Thuy Tinh',
      '',
      'COMBO SPIRIT BEASTS:',
      '  x10 Rooster | x25 Elephant | x50 Horse',
      '',
      'Blue sea beasts climb the flood (pressure only).',
      'Set your name on the menu to save personal best.',
      'Ink blind & flash floods appear in later rounds.',
      '',
      'WIN: survive the timer with mountain above water.',
      '  Level 1: 90s  |  Level 2 & 3: 120s',
    ];

    this.add
      .text(w / 2, 108, lines.join('\n'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#2D3436',
        align: 'center',
        lineSpacing: 3,
      })
      .setOrigin(0.5, 0);

    createPillButton(
      this,
      w / 2,
      h - 72,
      220,
      50,
      this.autoStart ? 'START!' : 'BACK',
      async () => {
        await audioManager.unlock({ proceduralMusic: !bgmController.isTrackReady('gameplay') });
        if (this.autoStart) {
          this.scene.start('GameScene', { fromMenu: true });
        } else {
          this.scene.start('MenuScene');
        }
      },
      !this.autoStart
    );

    bgmController.play(this, 'menu');
  }

  update(_t, delta) {
    if (this.scenery) this.scenery.update(delta / 1000, 0);
  }

  shutdown() {
    this.scenery?.destroy();
    if (!this.scene.isActive('MenuScene')) bgmController.stop();
  }
}
