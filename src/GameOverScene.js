import Phaser from 'phaser';
import { audioManager } from './audio/AudioManager.js';
import { bgmController, stopUnderlyingSceneAudio } from './audio/BgmController.js';
import { setGamePhase } from './gameSession.js';
import { platform } from '../platform/index.js';
import { SceneryView } from './systems/SceneryView.js';
import {
  createArcadeTitle,
  createPillButton,
  createChoiceLabelBar,
  createSmallBlueButton,
} from './ui/phaserUi.js';
import { createMuteToggle } from './ui/MuteToggle.js';
import { VictoryFinaleView } from './ui/VictoryFinaleView.js';
import { DefianceScrollView } from './ui/DefianceScrollView.js';
import { NgocHoaCallView } from './ui/NgocHoaCallView.js';
import { NgocHoaFarewellView } from './ui/NgocHoaFarewellView.js';
import { SubmissionScrollView } from './ui/SubmissionScrollView.js';
import { MAX_GAME_LEVEL } from './core/levelConfig.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.overlay = data.overlay ?? false;
    this.timeSurvived = data.timeSurvived ?? 0;
    this.victory = data.victory ?? false;
    this.score = data.score ?? 1;
    this.peakGap = data.peakGap ?? 0;
    this.nearGap = data.nearGap ?? 0;
    this.rank = data.rank ?? 0;
    this.gameLevel = data.gameLevel ?? 1;
    this.sessionDuration = data.sessionDuration ?? 90;
    /** @type {VictoryFinaleView|null} */
    this.victoryFinale = null;
    /** @type {DefianceScrollView|null} */
    this.defianceScroll = null;
    /** @type {NgocHoaCallView|null} */
    this.ngocHoaCall = null;
    /** @type {NgocHoaFarewellView|null} */
    this.farewellView = null;
    /** @type {SubmissionScrollView|null} */
    this.submissionScroll = null;
    /** @type {Phaser.GameObjects.GameObject[]} */
    this.l1ChallengeLayer = [];
    /** @type {Phaser.GameObjects.Container|null} */
    this.l1ChoiceUi = null;
    this.l1PeacefulFinale = false;
  }

  create() {
    setGamePhase('GAMEOVER');
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    if (this.victory && this.overlay && this.gameLevel === 1) {
      this._createVictoryL1Overlay(w, h);
    } else if (this.victory && this.overlay && this.gameLevel === 2) {
      this._createVictoryL2Overlay(w, h);
    } else if (this.victory && this.overlay && this.gameLevel >= MAX_GAME_LEVEL) {
      this._createVictoryMaxOverlay(w, h);
    } else if (this.victory && this.overlay) {
      this._createVictoryOverlay(w, h);
    } else if (!this.victory && this.overlay && this.gameLevel === 1) {
      this._createDefeatL1Overlay(w, h);
    } else if (!this.victory && this.overlay && this.gameLevel === 2) {
      this._createDefeatL2Overlay(w, h);
    } else if (!this.victory && this.overlay && this.gameLevel >= 3) {
      this._createDefeatMaxOverlay(w, h);
    } else {
      this._createStandardEnd(w, h);
    }

    createMuteToggle(this, w - 22, 28, 60);

    void audioManager.unlock();

    stopUnderlyingSceneAudio(this);
    bgmController.stop();
    if (this.victory) {
      bgmController.play(this, 'victory');
      if (this.gameLevel >= 2 && bgmController.isTrackReady('ngochoa')) {
        this.time.delayedCall(1200, () => bgmController.playOneShot(this, 'ngochoa'));
      }
    } else {
      bgmController.play(this, 'defeat');
    }
  }

  /**
   * Thắng L1 — banner vàng (Sơn Tinh thắng) + khung xanh (Thủy Tinh thách lại).
   * @param {number} w
   * @param {number} h
   */
  _createVictoryL1Overlay(w, h) {
    this.l1ChallengeLayer = [];
    this.l1PeacefulFinale = false;
    const track = (obj) => {
      if (obj) this.l1ChallengeLayer.push(obj);
      return obj;
    };

    this.cameras.main.flash(400, 255, 234, 167);
    track(this.add.rectangle(w / 2, h * 0.5, w, h, 0x000000, 0.12).setDepth(40));

    track(
      this.add
        .rectangle(w / 2, h * 0.1, w - 24, 72, 0xf1c40f, 0.22)
        .setStrokeStyle(2, 0xfdcb6e, 0.9)
        .setDepth(45)
    );
    track(
      this.add
        .text(w / 2, h * 0.065, 'SON TINH WINS!', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#FFEAA7',
        })
        .setOrigin(0.5)
        .setDepth(46)
        .setShadow(2, 2, '#2D3436', 4, true, true)
    );

    track(
      this.add
        .text(w / 2, h * 0.095, 'Round one won — Ngoc Hoa is safe on the mountain', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#FFF8E7',
        })
        .setOrigin(0.5)
        .setDepth(46)
    );

    const rankLine =
      this.rank > 0
        ? `Rank #${this.rank}  ·  ${this.timeSurvived}s  ·  ${this.score} pts`
        : `${this.timeSurvived}s  ·  ${this.score} pts`;
    track(
      this.add
        .text(w / 2, h * 0.13, rankLine, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#FFEAA7',
        })
        .setOrigin(0.5)
        .setDepth(46)
    );

    track(this.add.rectangle(w / 2, h * 0.165, w - 60, 2, 0x2980b9, 0.7).setDepth(46));

    track(
      this.add
        .text(w / 2, h * 0.185, 'But Thuy Tinh refuses defeat — he sends a challenge!', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#85C1E9',
          align: 'center',
          wordWrap: { width: w - 48 },
        })
        .setOrigin(0.5, 0)
        .setDepth(46)
        .setShadow(1, 1, '#0a1628', 3, true, true)
    );

    this.defianceScroll = new DefianceScrollView(this, w, h, { panelY: h * 0.5 });

    this.l1ChoiceUi = this.add.container(0, 0).setDepth(55);
    const choiceBar = createChoiceLabelBar(this, w / 2, h * 0.715, 280, 'ACCEPT CHALLENGE?');
    const yesBtn = createSmallBlueButton(this, w * 0.38, h * 0.775, 'YES', () =>
      this._onAcceptChallenge()
    );
    const noBtn = createSmallBlueButton(this, w * 0.62, h * 0.775, 'NO', () => this._onDeclineChallenge());
    this.l1ChoiceUi.add([choiceBar, yesBtn, noBtn]);

    const menu = this._addMenuLink(w, h * 0.84, 55);
    track(menu.menuBg);
    track(menu.menuBtn);
  }

  /**
   * Win Level 2 — Thuy Tinh submits + delayed finale.
   * @param {number} w
   * @param {number} h
   */
  _createVictoryL2Overlay(w, h) {
    this.cameras.main.flash(400, 255, 234, 167);
    this.add.rectangle(w / 2, h * 0.5, w, h, 0x000000, 0.12).setDepth(40);

    this.add
      .rectangle(w / 2, h * 0.09, w - 24, 68, 0xf1c40f, 0.24)
      .setStrokeStyle(2, 0xfdcb6e, 0.9)
      .setDepth(45);

    this.add
      .text(w / 2, h * 0.06, 'SON TINH WINS!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#FFEAA7',
      })
      .setOrigin(0.5)
      .setDepth(46)
      .setShadow(2, 2, '#2D3436', 4, true, true);

    this.add
      .text(w / 2, h * 0.085, 'Round two won — the storm retreats from the mountain', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FFF8E7',
      })
      .setOrigin(0.5)
      .setDepth(46);

    this.add.rectangle(w / 2, h * 0.125, w - 60, 2, 0x2980b9, 0.75).setDepth(46);

    this.add
      .text(w / 2, h * 0.14, 'Thuy Tinh surrenders — words of heartfelt submission', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#85C1E9',
        align: 'center',
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0.5, 0)
      .setDepth(46);

    this.submissionScroll = new SubmissionScrollView(this, w, h, {
      author: 'thuy_tinh',
      panelY: h * 0.22,
      compact: true,
    });

    const rankLine =
      this.rank > 0
        ? `L2 Rank #${this.rank}  ·  ${this.timeSurvived}s  ·  ${this.score} pts`
        : `L2 ${this.timeSurvived}s  ·  ${this.score} pts`;
    this.add
      .text(w / 2, h * 0.72, rankLine, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FFEAA7',
      })
      .setOrigin(0.5)
      .setDepth(55);

    createPillButton(this, w / 2, h * 0.78, 280, 52, 'PLAY AGAIN', () => this._onReplay()).setDepth(55);
    this._addMenuLink(w, h * 0.86, 55);

    this.time.delayedCall(2800, () => {
      if (!this.scene.isActive('GameOverScene')) return;
      this.victoryFinale = new VictoryFinaleView(this, w, h);
    });
  }

  /**
   * Win Level Max — Thuy Tinh submits + story finale.
   * @param {number} w
   * @param {number} h
   */
  _createVictoryMaxOverlay(w, h) {
    this.cameras.main.flash(400, 255, 234, 167);
    this.add.rectangle(w / 2, h * 0.5, w, h, 0x000000, 0.12).setDepth(40);

    this.add
      .rectangle(w / 2, h * 0.09, w - 24, 68, 0xf1c40f, 0.24)
      .setStrokeStyle(2, 0xfdcb6e, 0.9)
      .setDepth(45);

    this.add
      .text(w / 2, h * 0.06, 'SON TINH WINS!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#FFEAA7',
      })
      .setOrigin(0.5)
      .setDepth(46)
      .setShadow(2, 2, '#2D3436', 4, true, true);

    this.add
      .text(w / 2, h * 0.085, 'The final battle ends — the legend is complete', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FFF8E7',
      })
      .setOrigin(0.5)
      .setDepth(46);

    this.add
      .rectangle(w / 2, h * 0.125, w - 60, 2, 0x1b7f4a, 0.75)
      .setDepth(46);

    this.add
      .text(w / 2, h * 0.14, 'Thuy Tinh surrenders — words of heartfelt submission', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#A9DFBF',
        align: 'center',
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0.5, 0)
      .setDepth(46);

    this.submissionScroll = new SubmissionScrollView(this, w, h, {
      author: 'thuy_tinh',
      panelY: h * 0.48,
    });

    const rankLine =
      this.rank > 0
        ? `MAX Rank #${this.rank}  ·  ${this.timeSurvived}s  ·  ${this.score} pts`
        : `MAX ${this.timeSurvived}s  ·  ${this.score} pts`;
    this.add
      .text(w / 2, h * 0.72, rankLine, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FFEAA7',
      })
      .setOrigin(0.5)
      .setDepth(55);

    createPillButton(this, w / 2, h * 0.78, 280, 52, 'PLAY AGAIN', () => this._onReplay()).setDepth(55);
    this._addMenuLink(w, h * 0.86, 55);

    this.time.delayedCall(2800, () => {
      if (!this.scene.isActive('GameOverScene')) return;
      this.victoryFinale = new VictoryFinaleView(this, w, h);
    });
  }

  /**
   * Chrome dưới finale: rank + PLAY AGAIN + menu.
   * @param {number} w
   * @param {number} h
   * @param {{ rankPrefix?: string }} [opts]
   */
  _addVictoryFinaleChrome(w, h, opts = {}) {
    const prefix = opts.rankPrefix ?? '';
    const rankLine =
      this.rank > 0
        ? `${prefix}Rank #${this.rank}  ·  ${this.timeSurvived}s  ·  ${this.score} pts`
        : `${prefix}${this.timeSurvived}s  ·  ${this.score} pts`;
    this.add
      .text(w / 2, h * 0.79, rankLine, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FFEAA7',
      })
      .setOrigin(0.5)
      .setDepth(55)
      .setShadow(1, 1, '#2D3436', 3, true, true);

    createPillButton(this, w / 2, h * 0.885, 280, 52, 'PLAY AGAIN', () => this._onReplay()).setDepth(55);
    this._addMenuLink(w, h * 0.945, 55);
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  _createVictoryOverlay(w, h) {
    this.cameras.main.flash(400, 255, 234, 167);
    this.victoryFinale = new VictoryFinaleView(this, w, h);

    const isMax = this.gameLevel >= MAX_GAME_LEVEL;
    const lvNote = isMax
      ? ' — The legend is complete!'
      : this.gameLevel >= 2
        ? ' — Storm cleared!'
        : '';
    createArcadeTitle(this, w / 2, h * 0.47, 'SON TINH WINS!', `Ngoc Hoa is safe${lvNote}`);

    const lvTag = isMax ? 'MAX ' : this.gameLevel >= 2 ? `L${this.gameLevel} ` : '';
    this._addVictoryFinaleChrome(w, h, { rankPrefix: lvTag });
  }

  /**
   * Ngoc Hoa farewell cinematic — above dim overlay, below UI text.
   * @param {number} w
   * @param {number} h
   * @param {{ y?: number }} [opts]
   */
  _showFarewellCinematic(w, h, opts = {}) {
    this.farewellView = new NgocHoaFarewellView(this, {
      x: w * 0.55,
      y: opts.y ?? h * 0.3,
      depth: 48,
      scale: 1.55,
      large: true,
    });
  }

  /**
   * Thua Level 1.
   * @param {number} w
   * @param {number} h
   */
  _createDefeatL1Overlay(w, h) {
    this.cameras.main.shake(200, 0.012);
    this.add.rectangle(w / 2, h * 0.5, w, h, 0x000000, 0.18).setDepth(40);

    this._showFarewellCinematic(w, h, { y: h * 0.3 });

    createArcadeTitle(this, w / 2, h * 0.08, 'THUY TINH RAGES!', 'The flood nearly reached Ngoc Hoa');

    const remain = Math.max(0, this.sessionDuration - this.timeSurvived);
    this.add
      .text(w / 2, h * 0.145, `Held ${this.timeSurvived}s · ${remain}s short · Gap ${this.nearGap}m`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#AADDFF',
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setShadow(1, 1, '#0a1628', 3, true, true);

    this.ngocHoaCall = new NgocHoaCallView(this, w, h, { panelY: h * 0.58 });

    createPillButton(this, w * 0.32, h * 0.74, 152, 50, 'SAVE NGOC HOA!', () =>
      this._onReplay()
    ).setDepth(55);

    createPillButton(this, w * 0.68, h * 0.74, 132, 50, 'MAIN MENU', () =>
      this._goMainMenu()
    ).setDepth(55);

    this._addMenuLink(w, h * 0.84, 55);
  }

  /**
   * Thua Level 2 — Sơn Tinh gào Ngọc Hoa, xin trận sinh tử.
   * @param {number} w
   * @param {number} h
   */
  _createDefeatL2Overlay(w, h) {
    this.cameras.main.shake(280, 0.015);
    this.add.rectangle(w / 2, h * 0.5, w, h, 0x000000, 0.18).setDepth(40);

    this._showFarewellCinematic(w, h, { y: h * 0.3 });

    createArcadeTitle(this, w / 2, h * 0.08, 'THUY TINH TRIUMPHS!', 'The storm broke through the mountain');

    const remain = Math.max(0, this.sessionDuration - this.timeSurvived);
    this.add
      .text(w / 2, h * 0.145, `Held ${this.timeSurvived}s · ${remain}s short · Gap ${this.nearGap}m`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#AADDFF',
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setShadow(1, 1, '#0a1628', 3, true, true);

    this.ngocHoaCall = new NgocHoaCallView(this, w, h, { panelY: h * 0.58 });

    createPillButton(this, w * 0.32, h * 0.74, 132, 50, 'NGOC HOA!', () =>
      this._onFinalStand()
    ).setDepth(55);

    createPillButton(this, w * 0.68, h * 0.74, 132, 50, 'PLAY AGAIN', () => this._onReplay()).setDepth(
      55
    );

    this._addMenuLink(w, h * 0.84, 55);
  }

  /**
   * Thua Level Max — GAME OVER, không level tiếp theo.
   * @param {number} w
   * @param {number} h
   */
  _createDefeatMaxOverlay(w, h) {
    this.cameras.main.shake(400, 0.02);
    this.cameras.main.flash(300, 116, 185, 255);
    this.add.rectangle(w / 2, h * 0.5, w, h, 0x000000, 0.2).setDepth(40);

    this._showFarewellCinematic(w, h, { y: h * 0.28 });

    createArcadeTitle(this, w / 2, h * 0.08, 'GAME OVER', 'The final storm decided everything');

    this.add
      .text(w / 2, h * 0.145, `Held ${this.timeSurvived}s · Gap ${this.nearGap}m`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#AADDFF',
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.add
      .text(w / 2, h * 0.175, 'Son Tinh surrenders — words of heartfelt submission', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#F5B7B1',
        align: 'center',
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0.5, 0)
      .setDepth(50);

    this.submissionScroll = new SubmissionScrollView(this, w, h, {
      author: 'son_tinh',
      panelY: h * 0.58,
      compact: true,
    });

    const rankLine =
      this.rank > 0 ? `MAX rank #${this.rank}  ·  Score ${this.score}` : `Score: ${this.score}`;
    this.add
      .text(w / 2, h * 0.72, rankLine, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#85C1E9',
      })
      .setOrigin(0.5)
      .setDepth(55);

    createPillButton(this, w / 2, h * 0.78, 280, 54, 'PLAY AGAIN', () => this._onReplay()).setDepth(55);

    this._addMenuLink(w, h * 0.86, 55);
  }

  _goMainMenu() {
    this.scene.stop('GameScene');
    this.scene.stop('GameOverScene');
    this.scene.start('MenuScene');
  }

  /**
   * @param {number} w
   * @param {number} menuY
   * @param {number} depth
   */
  _addMenuLink(w, menuY, depth) {
    const menuBg = this.add
      .rectangle(w / 2, menuY, 220, 38, 0x0a1628, 0.55)
      .setStrokeStyle(2, 0xf1c40f, 0.9)
      .setDepth(depth);
    const menuBtn = this.add
      .text(w / 2, menuY, 'Main Menu', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#FFEAA7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(depth + 1)
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => this._goMainMenu());
    menuBtn.on('pointerover', () => menuBg.setFillStyle(0x1b7f4a, 0.75));
    menuBtn.on('pointerout', () => menuBg.setFillStyle(0x0a1628, 0.55));
    return { menuBg, menuBtn };
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  _createStandardEnd(w, h) {
    if (!this.overlay) {
      const act = this.victory ? 0 : 2;
      this.scenery = new SceneryView(this, w, h, h * 0.7);
      this.scenery.setAct(act);
      this.add.rectangle(w / 2, h / 2, w, h, 0xffffff, 0.45);
    } else {
      this.add.rectangle(w / 2, h * 0.38, w, h * 0.76, 0x000000, 0.16);
      this.add.rectangle(w / 2, h * 0.82, w, h * 0.38, 0xfff8e7, 0.92);
    }

    if (this.victory) {
      this.cameras.main.flash(300, 255, 234, 167);
    } else if (!this.overlay) {
      this.cameras.main.flash(300, 116, 185, 255);
      this.cameras.main.shake(180, 0.01);
    }

    const titleY = this.overlay ? h * 0.52 : 130;
    const title = this.victory ? 'SON TINH WINS!' : 'THUY TINH RAGES!';
    const subtitle = this.victory
      ? 'Ngoc Hoa is safe on the mountain'
      : 'The flood nearly reached Ngoc Hoa';

    createArcadeTitle(this, w / 2, titleY, title, subtitle);

    const msgY = this.overlay ? h * 0.6 : 210;
    let body;
    if (this.victory) {
      body = `You escorted Princess Ngoc Hoa for ${this.timeSurvived}s.\nThe mountain held — Thuy Tinh retreats!`;
    } else {
      const remain = Math.max(0, this.sessionDuration - this.timeSurvived);
      body = `Held ${this.timeSurvived}s · ${remain}s short of victory.\nGap at end: ${this.nearGap}m`;
    }

    this.add
      .text(w / 2, msgY, body, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#2D3436',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 7,
      })
      .setOrigin(0.5)
      .setShadow(1, 1, '#ffffff', 2, true, true);

    const rankLine =
      this.rank > 0 ? `Leaderboard rank: #${this.rank}  ·  Score ${this.score}` : `Score: ${this.score}`;
    this.add
      .text(w / 2, msgY + 52, rankLine, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#636E72',
      })
      .setOrigin(0.5);

    const ctaY = this.overlay ? h * 0.68 : h * 0.58;
    const ctaLabel = this.victory ? 'PLAY AGAIN' : 'SAVE NGOC HOA!';
    createPillButton(this, w / 2, ctaY, 280, 54, ctaLabel, () => this._onReplay());

    const menuY = this.overlay ? h * 0.78 : h * 0.72;
    const menuBg = this.add
      .rectangle(w / 2, menuY, 210, 38, 0xffffff, 0.5)
      .setStrokeStyle(2, 0xe17055, 0.85);
    const menuBtn = this.add
      .text(w / 2, menuY, 'Main Menu', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#C0392B',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
    menuBtn.on('pointerover', () => menuBg.setFillStyle(0xffffff, 0.85));
    menuBtn.on('pointerout', () => menuBg.setFillStyle(0xffffff, 0.5));
  }

  update(_t, delta) {
    if (this.scenery) this.scenery.update(delta / 1000, this.victory ? 0 : 2);
  }

  shutdown() {
    this.victoryFinale?.destroy();
    this.victoryFinale = null;
    this.defianceScroll?.destroy();
    this.defianceScroll = null;
    this.ngocHoaCall?.destroy();
    this.ngocHoaCall = null;
    this.farewellView?.destroy();
    this.farewellView = null;
    this.submissionScroll?.destroy();
    this.submissionScroll = null;
    this._clearL1ChallengeUi();
    this.scenery?.destroy();
  }

  _clearL1ChallengeUi() {
    for (const obj of this.l1ChallengeLayer) {
      obj.destroy();
    }
    this.l1ChallengeLayer = [];
    this.l1ChoiceUi?.destroy(true);
    this.l1ChoiceUi = null;
  }

  /**
   * Từ chối thách đấu L2 — finale rước Ngọc Hoa.
   */
  _onDeclineChallenge() {
    if (this.l1PeacefulFinale) return;
    this.l1PeacefulFinale = true;

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.defianceScroll?.destroy();
    this.defianceScroll = null;
    this._clearL1ChallengeUi();

    this.cameras.main.flash(400, 255, 234, 167);
    this.victoryFinale = new VictoryFinaleView(this, w, h);
    createArcadeTitle(
      this,
      w / 2,
      h * 0.47,
      'SON TINH WINS!',
      'Son Tinh escorts Ngoc Hoa — peace at last'
    );
    this._addVictoryFinaleChrome(w, h);

    if (bgmController.isTrackReady('ngochoa')) {
      this.time.delayedCall(1200, () => bgmController.playOneShot(this, 'ngochoa'));
    }
  }

  async _startRun(sceneData) {
    await audioManager.unlock();
    if (this.sound.context?.state === 'suspended') {
      await this.sound.context.resume();
    }

    if (platform.getHasCompletedRun()) {
      await platform.showInterstitial();
    }

    this.victoryFinale?.destroy();
    this.victoryFinale = null;
    this.defianceScroll?.destroy();
    this.defianceScroll = null;
    this.ngocHoaCall?.destroy();
    this.ngocHoaCall = null;
    this.farewellView?.destroy();
    this.farewellView = null;
    this.submissionScroll?.destroy();
    this.submissionScroll = null;
    this._clearL1ChallengeUi();

    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('GameScene');
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene', sceneData);
    });
  }

  async _onAcceptChallenge() {
    await this._startRun({ gameLevel: 2, isChallengeRematch: true, isReplay: true });
  }

  async _onFinalStand() {
    await this._startRun({ gameLevel: 3, isFinalStand: true, isReplay: true });
  }

  async _onReplay() {
    await this._startRun({ isReplay: true, gameLevel: 1 });
  }
}
