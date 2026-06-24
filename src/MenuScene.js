import Phaser from 'phaser';
import { audioManager } from './audio/AudioManager.js';
import { bgmController } from './audio/BgmController.js';
import { setGamePhase } from './gameSession.js';
import { SceneryView } from './systems/SceneryView.js';
import { createArcadeTitle, createPillButton } from './ui/phaserUi.js';
import { createMuteToggle } from './ui/MuteToggle.js';
import { LegendSummaryView } from './ui/LegendSummaryView.js';
import { LeaderboardOverlayView } from './ui/LeaderboardOverlayView.js';

/**
 * MenuScene — compact menu, leaderboard overlay.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    setGamePhase('MENU');
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.scenery = new SceneryView(this, w, h, h * 0.78);
    /** @type {LegendSummaryView|null} */
    this.legendView = null;
    /** @type {LeaderboardOverlayView|null} */
    this.leaderboardView = null;

    this.add
      .image(w / 2, h * 0.32, 'game_assets', 'mountain')
      .setScale(0.88)
      .setAlpha(0.95);

    this.add.image(w * 0.34, h * 0.28, 'game_assets', 'hero_sontinh').setScale(1.05);
    this.add.image(w * 0.48, h * 0.275, 'game_assets', 'hero_minuong').setScale(0.98);
    this.add
      .image(w * 0.78, h * 0.36, 'game_assets', 'boss_thuytinh')
      .setScale(0.9)
      .setAlpha(0.5);

    createArcadeTitle(this, w / 2, h * 0.07, 'CHOOSING A', 'Son-in-Law');
    this.add
      .text(w / 2, h * 0.145, 'Son Tinh · Thuy Tinh', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#2D3436',
      })
      .setOrigin(0.5)
      .setShadow(1, 1, '#ffffff', 2, true, true);

    this._buildLeaderboardButton(w, h);

    createPillButton(this, w / 2, h * 0.62, 220, 52, 'BEGIN', async () => {
      const hasBgm = bgmController.isTrackReady('gameplay');
      await audioManager.unlock({ proceduralMusic: !hasBgm });
      if (this.sound.context?.state === 'suspended') {
        await this.sound.context.resume();
      }
      const seen = localStorage.getItem('sontinh_howto_seen');
      if (!seen) {
        localStorage.setItem('sontinh_howto_seen', '1');
        this.scene.start('HowToPlayScene', { autoStart: true });
      } else {
        this.scene.start('GameScene', { fromMenu: true });
      }
    });

    const legendBg = this.add
      .rectangle(w / 2, h * 0.72, 220, 36, 0xffffff, 0.6)
      .setStrokeStyle(2, 0x1b7f4a, 0.9);
    const legendBtn = this.add
      .text(w / 2, h * 0.72, 'LEGEND SUMMARY', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#1B7F4A',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    legendBtn.on('pointerdown', () => this._openLegendSummary(w, h));
    legendBtn.on('pointerover', () => legendBg.setFillStyle(0xffffff, 0.88));
    legendBtn.on('pointerout', () => legendBg.setFillStyle(0xffffff, 0.6));

    const howToBg = this.add
      .rectangle(w / 2, h * 0.79, 200, 36, 0xffffff, 0.55)
      .setStrokeStyle(2, 0xe17055, 0.9);
    const howTo = this.add
      .text(w / 2, h * 0.79, 'How to Play', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#C0392B',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    howTo.on('pointerdown', () => this.scene.start('HowToPlayScene'));
    howTo.on('pointerover', () => howToBg.setFillStyle(0xffffff, 0.85));
    howTo.on('pointerout', () => howToBg.setFillStyle(0xffffff, 0.55));

    createMuteToggle(this, w - 22, 28, 25);

    bgmController.play(this, 'menu');
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  _openLegendSummary(w, h) {
    if (this.legendView) return;
    this.legendView = new LegendSummaryView(this, w, h, () => {
      this.legendView = null;
    });
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  _buildLeaderboardButton(w, h) {
    const btnY = h * 0.52;

    this.lbToggleBg = this.add
      .rectangle(w / 2, btnY, 200, 38, 0xffffff, 0.78)
      .setStrokeStyle(2, 0xfdcb6e, 0.95)
      .setInteractive({ useHandCursor: true });

    this.lbToggleLabel = this.add
      .text(w / 2, btnY, 'TOP RUNS', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#E17055',
      })
      .setOrigin(0.5);

    const open = () => this._openLeaderboard(w, h);
    this.lbToggleBg.on('pointerdown', open);
    this.lbToggleLabel.setInteractive({ useHandCursor: true });
    this.lbToggleLabel.on('pointerdown', open);
    this.lbToggleBg.on('pointerover', () => this.lbToggleBg.setFillStyle(0xffffff, 0.95));
    this.lbToggleBg.on('pointerout', () => this.lbToggleBg.setFillStyle(0xffffff, 0.78));
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  _openLeaderboard(w, h) {
    if (this.leaderboardView) return;
    this.leaderboardView = new LeaderboardOverlayView(this, w, h, () => {
      this.leaderboardView = null;
    });
  }

  update(_t, delta) {
    if (this.scenery) this.scenery.update(delta / 1000, 0);
  }

  shutdown() {
    this.legendView?.destroy();
    this.legendView = null;
    this.leaderboardView?.destroy();
    this.leaderboardView = null;
    this.scenery?.destroy();
    bgmController.stop();
  }
}
