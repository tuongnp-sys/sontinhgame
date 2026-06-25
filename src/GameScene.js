import Phaser from 'phaser';
import balance from './data/balance.json';
import disruptorConfig from './data/disruptors.json';
import { GameController } from './core/GameController.js';
import { audioManager } from './audio/AudioManager.js';
import { toggleMutedPreference, loadMutedPreference, applyMutedPreference } from './audio/audioPreferences.js';
import { bgmController } from './audio/BgmController.js';
import { setGamePhase, setUserPaused } from './gameSession.js';
import { enterSystemPause, exitSystemPause } from './systemPause.js';
import { platform } from '../platform/index.js';
import { SceneryView } from './systems/SceneryView.js';
import palettes from './data/palettes.json';
import { hexToNum } from './ui/phaserUi.js';
import { addLeaderboardEntry, getPlayerName } from './core/Leaderboard.js';
import { StormView } from './systems/StormView.js';
import { LightningView } from './systems/LightningView.js';
import { CharmThrowView } from './systems/CharmThrowView.js';
import { BattlefieldCamera } from './systems/BattlefieldCamera.js';
import { createMuteToggle } from './ui/MuteToggle.js';
import { getExpandCropInsets, safeTop, safeRightX } from './ui/safeHud.js';

const NOTE_FRAME = {
  earth: 'note_earth',
  wood: 'note_wood',
  fire: 'note_fire',
  poison: 'note_poison',
  hold: 'note_hold',
};

/**
 * GameScene — orchestration: controller + view.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    /** @type {GameController|null} */
    this.controller = null;
  }

  init(data) {
    this.fromMenu = data.fromMenu ?? false;
    this.isReplay = data.isReplay ?? false;
    this.gameLevel = data.gameLevel ?? 1;
    this.isChallengeRematch = data.isChallengeRematch ?? false;
    this.isFinalStand = data.isFinalStand ?? false;
  }

  create() {
    setGamePhase('PLAYING');
    setUserPaused(false);

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.controller = new GameController(balance, disruptorConfig, this.gameLevel);
    const hitY = h * 0.66;
    const spawnY = h * 0.36;
    this.controller.rhythm.hitZoneX = w / 2;
    this.controller.rhythm.hitZoneY = hitY;
    this.controller.rhythm.laneSpawnY = spawnY;
    this.controller.rhythm.laneMissY = hitY + 85;
    this.controller.rhythm.screenWidth = w;

    this.noteSprites = new Map();
    this.monsterGroup = this.add.group();
    this._invasionSpawnAcc = 0;
    this.invasionPool = [];

    const battleH = h * 0.62;
    this.scenery = new SceneryView(this, w, h, battleH);

    this._buildBattlefield(w, h, battleH);
    this._buildRhythmLane(w, h);
    this._buildHud(w);
    this._buildPauseOverlay(w, h);

    this.inkOverlay = this.add
      .image(w / 2, hitY, 'game_assets', 'ink_blob')
      .setDepth(20)
      .setAlpha(0)
      .setVisible(false)
      .setScale(1.4);
    this.inkFading = false;
    this._wasBlinded = false;

    this._viewCache = {
      mountainScale: 0,
      waterH: -1,
      flashFlood: null,
      bossAlpha: -1,
      gapBarWidth: -1,
      gapBarColor: 0,
      balanceSonW: -1,
      balanceThuyW: -1,
      gapText: '',
      combo: -1,
      comboLocked: null,
      timer: -1,
      actBannerKey: '',
      lastPlatformScore: 0,
      lastPlatformAct: -1,
      dangerRatio: -1,
      lastAct: -1,
      auraAlpha: -1,
      lastPhase: '',
      waterSurfaceY: -1,
      clashKey: '',
    };

    this._platformTick = 0;

    this.input.on('pointerdown', () => this._onTap());
    this.input.on('pointerup', () => this._onHoldRelease());

    this.input.keyboard?.on('keydown-SPACE', (e) => {
      if (e.repeat) return;
      this._onTap();
    });
    this.input.keyboard?.on('keyup-SPACE', () => this._onHoldRelease());
    this.input.keyboard?.on('keydown-ESC', () => this._togglePause());

    if (this.fromMenu && !platform.getHasCompletedRun()) {
      platform.gameplayStart();
    } else if (this.isReplay) {
      platform.gameplayStart();
    }

    this.lastDangerLevel = -1;
    this._gameEnded = false;
    this.stormView = null;
    this.lightningView = null;
    this.charmThrowView = null;
    /** @type {BattlefieldCamera|null} */
    this.battleCamera = null;

    void this._bootAudio();

    const lv = this.controller.state.levelCfg;
    bgmController.play(this, 'gameplay');
    if (lv.rain) {
      const intensity = lv.stormIntensity ?? 1;
      this.stormView = new StormView(this, w, h, intensity);
      if (bgmController.isTrackReady('rain')) {
        bgmController.playAmbient(this, 'rain');
      }
      this._showStormIntro(w, h);
    }
    if (lv.lightning) {
      this.lightningView = new LightningView(this, w, h);
    }
    if (lv.charmThrow) {
      this.charmThrowView = new CharmThrowView(this);
    }
    if (lv.kingHungObserver) {
      this._setupKingHungObserver(h);
    }

    if (this.stormView?.root) this.battlefieldRoot.add(this.stormView.root);
    if (this.lightningView?.root) this.battlefieldRoot.add(this.lightningView.root);
    if (this.charmThrowView?.root) this.battlefieldRoot.add(this.charmThrowView.root);

    this.battleCamera = new BattlefieldCamera(this, w, this.battlefieldRoot, {
      sonX: this.sonTinhX,
      miX: this.miX,
      thuyX: this.thuyTinhX,
    });
  }

  async _bootAudio() {
    const hasBgm = bgmController.isTrackReady('gameplay');
    await audioManager.unlock({ proceduralMusic: !hasBgm });
    applyMutedPreference();
    if (this.sound.context?.state === 'suspended') {
      await this.sound.context.resume();
    }
  }

  /**
   * Vua Hùng quan sát trận sinh tử từ trên cao.
   * @param {number} h
   */
  _setupKingHungObserver(h) {
    const w = this.layoutW ?? this.cameras.main.width;
    this.kingHungImg
      .setPosition(w / 2, h * 0.07)
      .setScale(1.2)
      .setDepth(25)
      .setAlpha(1);
    this.add
      .ellipse(w / 2, h * 0.09, 90, 24, 0xf1c40f, 0.2)
      .setDepth(24);
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  _showStormIntro(w, h) {
    const lv = this.controller.state.levelCfg;
    const label =
      this.gameLevel >= 3 ? 'FINAL STAND — LIFE OR DEATH' : (lv.label ?? 'Level 2').toUpperCase();
    const banner = this.add
      .text(w / 2, h * 0.3, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#AADDFF',
      })
      .setOrigin(0.5)
      .setDepth(22)
      .setAlpha(0)
      .setShadow(2, 2, '#0a1628', 4, true, true);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 450,
      yoyo: true,
      hold: 2200,
      onComplete: () => banner.destroy(),
    });
  }

  /**
   * @param {number} w
   * @param {number} h
   * @param {number} battleH
   */
  _buildBattlefield(w, h, battleH) {
    this.battlefieldRoot = this.add.container(0, 0).setDepth(0);
    this.battleY = battleH;
    this.layoutW = w;
    this.mountainTexH = 320;
    this.miX = w * 0.5;
    this.sonTinhX = w * 0.22;
    this.thuyTinhX = w * 0.82;

    this.waterImg = this.add
      .image(w / 2, battleH, 'game_assets', 'water')
      .setOrigin(0.5, 1)
      .setDisplaySize(w, 1)
      .setDepth(2)
      .setAlpha(0.88);
    this.floodWave = this.add
      .image(w / 2, battleH, 'game_assets', 'wave_crest')
      .setOrigin(0.5, 1)
      .setVisible(false)
      .setDepth(3)
      .setAlpha(0.7);

    this.mountainImg = this.add
      .image(w / 2, battleH, 'game_assets', 'mountain')
      .setOrigin(0.5, 1)
      .setDepth(4);

    this.kingHungImg = this.add
      .image(w / 2, battleH - 280, 'game_assets', 'king_hung')
      .setOrigin(0.5, 1)
      .setScale(0.85)
      .setDepth(6);

    this.heroImg = this.add
      .image(this.sonTinhX, battleH - 80, 'game_assets', 'hero_sontinh')
      .setOrigin(0.5, 1)
      .setScale(1.1)
      .setDepth(7);

    this.miImg = this.add
      .image(this.miX, battleH - 60, 'game_assets', 'hero_minuong')
      .setOrigin(0.5, 1)
      .setScale(1.08)
      .setDepth(8);

    this.bossImg = this.add
      .image(this.thuyTinhX, battleH - 60, 'game_assets', 'boss_thuytinh')
      .setOrigin(0.5, 1)
      .setAlpha(0.9)
      .setScale(1.05)
      .setDepth(8);

    this.clashLine = this.add.graphics().setDepth(7).setAlpha(0);

    this.heroAura = this.add
      .circle(this.sonTinhX, battleH - 100, 28, 0xf1c40f, 0)
      .setDepth(6)
      .setStrokeStyle(2, 0xfdcb6e, 0);

    this.actBanner = this.add
      .text(w / 2, 100, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#FFEAA7',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(15)
      .setShadow(2, 2, '#D63031', 4, true, true);

    this.tweens.add({
      targets: this.heroImg,
      scaleY: 1.14,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: this.kingHungImg,
      scaleY: 1.06,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: this.bossImg,
      scaleX: 1.08,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const poolMul = this.controller?.state?.levelCfg?.invasionPoolMul ?? 1;
    const poolSize = Math.ceil(balance.invasion.poolSize * poolMul);
    for (let i = 0; i < poolSize; i++) {
      const m = this.add
        .image(0, h + 40, 'game_assets', 'monster_fish')
        .setOrigin(0.5, 1)
        .setAngle(-90)
        .setAlpha(0.9)
        .setDepth(3)
        .setVisible(false);
      m.invasionData = { active: false };
      this.invasionPool.push(m);
      this.monsterGroup.add(m);
      this.battlefieldRoot.add(m);
    }

    const battlefieldLayers = [
      this.waterImg,
      this.floodWave,
      this.mountainImg,
      this.kingHungImg,
      this.heroAura,
      this.heroImg,
      this.miImg,
      this.bossImg,
      this.clashLine,
    ];
    for (const layer of battlefieldLayers) {
      if (layer) this.battlefieldRoot.add(layer);
    }
  }

  /**
   * @param {import('./core/GameState.js').GameState} state
   * @param {number} waterSurfaceY
   */
  _spawnInvader(state, waterSurfaceY) {
    const unit = this.invasionPool.find((m) => !m.invasionData.active);
    if (!unit) return;

    const cfg = balance.invasion;
    const w = this.layoutW;
    const laneRoll = Math.random();
    let x;
    if (laneRoll < 0.3) x = w * (0.1 + Math.random() * 0.22);
    else if (laneRoll < 0.65) x = w * (0.38 + Math.random() * 0.24);
    else x = w * (0.66 + Math.random() * 0.26);

    const phaseMul = state.intensityPhase === 'climax' ? cfg.climaxSpeedMul : 1;
    const speed =
      (cfg.baseSpeed + state.dangerRatio * cfg.dangerSpeedBonus) *
      phaseMul *
      (state.levelCfg.invasionSpeedMul ?? 1);

    const spawnY = this.cameras.main.height + 18 + Math.random() * 36;

    if (state.levelCfg.charmThrow && this.charmThrowView) {
      this.charmThrowView.playThrowPose(this.heroImg);
      this.charmThrowView.playThrowPose(this.bossImg);
      this.charmThrowView.throwCharms(this.heroImg.x, this.heroImg.y - 36, x, spawnY, 'hero');
      this.charmThrowView.throwCharms(this.bossImg.x, this.bossImg.y - 36, x, spawnY, 'boss');
    }

    unit
      .setPosition(x, spawnY)
      .setVisible(true)
      .setAlpha(0.82 + Math.random() * 0.18)
      .setScale(0.85 + Math.random() * 0.2);
    unit.invasionData = {
      active: true,
      speed,
      drift: (this.miX - x) * (0.06 + state.dangerRatio * 0.04),
      holdTime: 0,
      frontY: waterSurfaceY - 4,
    };
  }

  _recycleInvader(unit) {
    unit.invasionData = { active: false };
    unit.setVisible(false);
    unit.y = this.cameras.main.height + 50;
  }

  _clearInvasionArmy() {
    for (const m of this.invasionPool) {
      if (m.invasionData.active) this._recycleInvader(m);
    }
    this._invasionSpawnAcc = 0;
  }

  /**
   * @param {import('./core/GameState.js').GameState} state
   * @param {number} dt
   */
  _updateInvasionArmy(state, dt) {
    const cfg = balance.invasion;
    const waterY =
      this._viewCache.waterSurfaceY > 0 ? this._viewCache.waterSurfaceY : this.battleY - 30;

    if (state.isCalmPhase) {
      return;
    }

    let interval =
      state.intensityPhase === 'climax' ? cfg.spawnIntervalClimax : cfg.spawnIntervalRise;
    if (state.currentAct >= 1) interval *= cfg.act2IntervalMul;
    if (state.currentAct >= 2) interval *= cfg.act3IntervalMul;
    interval *= state.levelCfg.invasionIntervalMul ?? 1;

    this._invasionSpawnAcc += dt;
    const extraChance = Math.max(0, (state.levelCfg.invasionCountMul ?? 1) - 1);
    while (this._invasionSpawnAcc >= interval) {
      this._invasionSpawnAcc -= interval;
      this._spawnInvader(state, waterY);
      if (extraChance > 0 && Math.random() < extraChance) {
        this._spawnInvader(state, waterY);
      }
      if (
        state.intensityPhase === 'climax' &&
        Math.random() < cfg.climaxDoubleSpawnChance
      ) {
        this._spawnInvader(state, waterY);
      }
    }

    const frozen = state.elephantStunRemaining > 0;
    const chickenRepel = state.activeBeast === 'chicken';

    for (const m of this.invasionPool) {
      const d = m.invasionData;
      if (!d.active) continue;

      d.frontY = waterY - 4;

      if (chickenRepel && m.y <= waterY + 16) {
        this._recycleInvader(m);
        continue;
      }

      if (frozen) continue;

      m.y -= d.speed * dt;
      m.x += d.drift * dt;

      if (m.y <= d.frontY) {
        m.y = d.frontY;
        d.holdTime += dt;
        if (d.holdTime >= cfg.holdAtFrontSeconds) {
          this._recycleInvader(m);
        }
      }

      if (m.y < this.battleY - 220) {
        this._recycleInvader(m);
      }
    }
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  _buildRhythmLane(w, h) {
    const hitY = h * 0.66;
    const spawnY = h * 0.36;
    this.laneY = hitY;
    this.laneSpawnY = spawnY;
    const laneW = 72;
    const laneH = hitY - spawnY + 50;

    this.laneTrack = this.add
      .rectangle(w / 2, spawnY + laneH / 2 - 10, laneW, laneH, 0xffffff, 0.18)
      .setDepth(8)
      .setStrokeStyle(2, 0xfdcb6e, 0.55);

    this.hitZone = this.add
      .image(w / 2, hitY, 'game_assets', 'ui_hit_zone')
      .setScale(0.85)
      .setDepth(10);

    const balanceBarW = 168;
    const balanceBarY = hitY + 48;
    this._balanceBarW = balanceBarW;

    this.balanceBarBg = this.add
      .rectangle(w / 2, balanceBarY, balanceBarW, 10, 0x2d3436, 0.35)
      .setDepth(11)
      .setStrokeStyle(1, 0xfdcb6e, 0.75);
    this.balanceSonFill = this.add
      .rectangle(w / 2 - balanceBarW / 2, balanceBarY, 0, 8, 0xe74c3c)
      .setOrigin(0, 0.5)
      .setDepth(11);
    this.balanceThuyFill = this.add
      .rectangle(w / 2 + balanceBarW / 2, balanceBarY, 0, 8, 0x3498db)
      .setOrigin(1, 0.5)
      .setDepth(11);
    this.balanceSonLabel = this.add
      .text(w / 2 - balanceBarW / 2 - 5, balanceBarY, 'S', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#c0392b',
      })
      .setOrigin(1, 0.5)
      .setDepth(11);
    this.balanceThuyLabel = this.add
      .text(w / 2 + balanceBarW / 2 + 5, balanceBarY, 'T', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#2980b9',
      })
      .setOrigin(0, 0.5)
      .setDepth(11);

    this.laneLine = this.add.graphics().setDepth(9);
    this.laneLine.lineStyle(2, 0xe17055, 0.25);
    this.laneLine.lineBetween(w / 2, spawnY, w / 2, hitY + 40);

    this.phaseBanner = this.add
      .text(w / 2, spawnY - 22, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#2D3436',
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setShadow(1, 1, '#ffffff', 3, true, true);
  }

  /**
   * @param {number} w
   */
  _buildHud(w) {
    this.gapBarBg = this.add
      .rectangle(w / 2, 42, 300, 14, 0x2d3436, 0.35)
      .setStrokeStyle(2, 0xfdcb6e, 0.8)
      .setDepth(15);
    this.gapBarFill = this.add
      .rectangle(w / 2 - 148, 42, 296, 10, hexToNum(palettes.ui.barTop))
      .setOrigin(0, 0.5)
      .setDepth(15);

    this.gapText = this.add
      .text(w / 2, 58, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#2D3436',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(1, 1, '#ffffff', 2, true, true);

    this.comboText = this.add
      .text(w - 16, 42, 'x0', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#FFEAA7',
      })
      .setOrigin(1, 0.5)
      .setDepth(15)
      .setShadow(1, 1, '#D63031', 3, true, true);

    this.levelBadge = this.add
      .text(w / 2, 14, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#636E72',
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(1, 1, '#ffffff', 2, true, true);

    this.timerText = this.add
      .text(16, 42, '0s', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#2D3436',
      })
      .setOrigin(0, 0.5)
      .setDepth(15)
      .setShadow(1, 1, '#ffffff', 2, true, true);

    this.feedbackText = this.add
      .text(w / 2, this.laneY - 40, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this._buildHudControls(w);

    this.scale.on(Phaser.Scale.Events.RESIZE, this._layoutSafeHud, this);
    this._layoutSafeHud();
  }

  /**
   * @param {number} w
   */
  _buildHudControls(w) {
    const mkPill = (label, strokeColor, textColor, onClick) => {
      const bg = this.add
        .rectangle(0, 0, 64, 30, 0xffffff, 0.93)
        .setStrokeStyle(2, strokeColor, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(26);
      const txt = this.add
        .text(0, 0, label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: textColor,
        })
        .setOrigin(0.5)
        .setDepth(27);
      const fire = () => {
        if (this._gameEnded) return;
        onClick();
      };
      bg.on('pointerdown', fire);
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', fire);
      bg.on('pointerover', () => bg.setFillStyle(0xffffff, 1));
      bg.on('pointerout', () => bg.setFillStyle(0xffffff, 0.93));
      return { bg, txt };
    };

    const pause = mkPill('PAUSE', 0x1b7f4a, '#1B7F4A', () => this._togglePause());
    this.pauseBtnBg = pause.bg;
    this.pauseBtnLabel = pause.txt;

    const stop = mkPill('STOP', 0xe17055, '#C0392B', () => this._exitToMenu());
    this.stopBtnBg = stop.bg;
    this.stopBtnLabel = stop.txt;

    this.muteToggle = createMuteToggle(this, 0, 0, 26);
  }

  _layoutSafeHud() {
    const w = this.cameras.main.width;
    const insets = getExpandCropInsets(this.scale);
    const rowY = safeTop(16, insets);
    const pauseX = safeRightX(8, w, insets);
    const stopX = safeRightX(78, w, insets);
    const muteX = safeRightX(22, w, insets);
    const muteY = safeTop(52, insets);

    this.pauseBtnBg?.setPosition(pauseX, rowY);
    this.pauseBtnLabel?.setPosition(pauseX, rowY);
    this.stopBtnBg?.setPosition(stopX, rowY);
    this.stopBtnLabel?.setPosition(stopX, rowY);
    this.muteToggle?.root?.setPosition(muteX, muteY);
  }

  _exitToMenu() {
    if (this._gameEnded) return;
    if (this.pauseGroup?.visible) this.pauseGroup.setVisible(false);
    if (this.controller?.rhythm.isHolding()) {
      this._applyHitResult(this.controller.handleHoldRelease());
    }
    setUserPaused(false);
    exitSystemPause();
    platform.gameplayStop();
    bgmController.stop();
    audioManager.stop();
    setGamePhase('MENU');
    this.scene.start('MenuScene');
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  _buildPauseOverlay(w, h) {
    this.pauseGroup = this.add.container(0, 0).setDepth(30).setVisible(false);
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75);
    const title = this.add.text(w / 2, h * 0.35, 'PAUSED', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#fff',
    }).setOrigin(0.5);

    const resumeBtn = this.add.rectangle(w / 2, h * 0.5, 200, 44, 0x228844).setInteractive();
    const resumeTxt = this.add.text(w / 2, h * 0.5, 'Resume', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#fff',
    }).setOrigin(0.5);

    const muteBtn = this.add.rectangle(w / 2, h * 0.58, 200, 44, 0x334455).setInteractive();
    this.muteLabel = this.add.text(w / 2, h * 0.58, `Sound: ${loadMutedPreference() ? 'OFF' : 'ON'}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#fff',
    }).setOrigin(0.5);

    const menuBtn = this.add.rectangle(w / 2, h * 0.66, 200, 44, 0x553333).setInteractive();
    const menuTxt = this.add.text(w / 2, h * 0.66, 'Main Menu', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#fff',
    }).setOrigin(0.5);

    this.pauseGroup.add([bg, title, resumeBtn, resumeTxt, muteBtn, this.muteLabel, menuBtn, menuTxt]);

    resumeBtn.on('pointerdown', () => this._togglePause(false));
    muteBtn.on('pointerdown', () => {
      toggleMutedPreference();
      this.muteLabel.setText(`Sound: ${loadMutedPreference() ? 'OFF' : 'ON'}`);
      this.muteToggle?.refresh();
    });
    menuBtn.on('pointerdown', () => this._exitToMenu());
  }

  _togglePause(force) {
    const show = force !== undefined ? force : !this.pauseGroup.visible;
    if (show && this.controller?.rhythm.isHolding()) {
      this._applyHitResult(this.controller.handleHoldRelease());
    }
    this.pauseGroup.setVisible(show);
    setUserPaused(show);
    if (show) {
      enterSystemPause('user_pause');
    } else {
      exitSystemPause();
    }
  }

  _onTap() {
    if (this.pauseGroup.visible || !this.controller) return;
    this._applyHitResult(this.controller.handleTap());
  }

  _onHoldRelease() {
    if (this.pauseGroup.visible || !this.controller) return;
    this._applyHitResult(this.controller.handleHoldRelease());
  }

  /**
   * @param {{ result: string, note?: object|null }} hit
   */
  _applyHitResult(hit) {
    const { result } = hit;
    if (result === 'ignore') return;

    if (result === 'perfect' || result === 'great' || result === 'good') {
      audioManager.playSfx(result === 'good' ? 'good' : result);
      this._showFeedback(result.toUpperCase(), result === 'perfect' ? '#ffdd00' : '#aaffaa');
      if (result === 'perfect') {
        this.tweens.add({
          targets: this.mountainImg,
          y: this.battleY - 6,
          duration: 80,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      }
      this.cameras.main.shake(60, 0.003);
    } else if (result === 'hold_start') {
      audioManager.playSfx('good');
      this._showFeedback('HOLD!', '#c39bd3');
    } else if (result === 'hold_complete') {
      audioManager.playSfx('great');
      this._showFeedback('HOLD +', '#9b59b6');
      this.cameras.main.shake(40, 0.002);
    } else if (result === 'poison_hit') {
      audioManager.playSfx('poison');
      this._showFeedback('POISON!', '#22ff66');
      this.cameras.main.flash(200, 80, 255, 80);
    } else if (result === 'miss') {
      audioManager.playSfx('miss');
      this._showFeedback('MISS', '#ff4444');
    } else if (result === 'locked') {
      this._showFeedback('LOCKED', '#888888');
    }
  }

  /**
   * @param {string} msg
   * @param {string} color
   */
  _showFeedback(msg, color) {
    this.feedbackText.setText(msg).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      y: this.feedbackText.y - 20,
      duration: 500,
      onComplete: () => {
        this.feedbackText.y = this.laneY - 40;
      },
    });
  }

  update(_time, delta) {
    if (!this.controller || this.pauseGroup.visible || this._gameEnded) return;

    const dt = Math.min(delta / 1000, 0.05);
    const { ended, victory, beast, event, phaseChanged, holdEvent } = this.controller.update(dt);
    const state = this.controller.state;

    if (holdEvent) {
      this._applyHitResult(holdEvent);
    }

    const danger = state.dangerRatio;
    if (Math.abs(danger - this._viewCache.dangerRatio) >= 0.02) {
      this._viewCache.dangerRatio = danger;
      audioManager.setDangerRatio(danger);
    }

    this._platformTick += dt;
    if (this._platformTick >= 0.5) {
      this._platformTick = 0;
      const act = state.currentAct + 1;
      const score = Math.max(1, Math.floor(state.elapsed * 10));
      if (act !== this._viewCache.lastPlatformAct) {
        this._viewCache.lastPlatformAct = act;
        platform.updateLevel(act);
      }
      if (score !== this._viewCache.lastPlatformScore) {
        this._viewCache.lastPlatformScore = score;
        platform.updateScore(score);
      }
    }

    this._syncNotes();
    this._syncBattlefield(state, dt);
    this._updateInvasionArmy(state, dt);
    this._syncHud(state);
    this._syncInk(state);
    this._syncActBanner(state);
    this._syncHeroAura(state);
    this._syncPhaseVisual(state, phaseChanged);

    this.stormView?.update(dt);
    this.scenery?.update(dt, state.currentAct);

    if (beast) this._showBeast(beast);
    if (event?.type === 'flash_flood') {
      this._showFeedback('FLASH FLOOD!', '#4488ff');
      this.cameras.main.shake(400, 0.015);
    }

    if (ended) {
      this._gameEnded = true;
      platform.setHasCompletedRun(true);
      platform.gameplayStop();
      platform.ping('game_over', { score: state.computeFinalScore(), victory });
      const survived = Math.floor(state.elapsed);
      const finalScore = state.computeFinalScore();
      const { rank } = addLeaderboardEntry({
        playerName: getPlayerName(),
        timeSurvived: survived,
        victory,
        score: finalScore,
        peakGap: Math.floor(state.peakGap),
        level: this.gameLevel,
      });

      this._applyEndPose(victory, state);
      this._hideGameplayUi();

      const overlayDelay = victory ? 1400 : this.gameLevel >= 3 ? 3600 : 2600;
      this.time.delayedCall(overlayDelay, () => {
        this.scene.launch('GameOverScene', {
          overlay: true,
          timeSurvived: survived,
          victory,
          score: finalScore,
          peakGap: Math.floor(state.peakGap),
          nearGap: Math.max(0, Math.floor(state.safetyGap)),
          rank,
          gameLevel: this.gameLevel,
          sessionDuration: state.sessionDuration,
        });
      });
    }
  }

  /**
   * @param {boolean} victory
   * @param {import('./core/GameState.js').GameState} state
   */
  _applyEndPose(victory, state) {
    const w = this.cameras.main.width;
    const scale = 0.65 + (state.mountainPeak / balance.initialMountain) * 0.45;
    const waterH = Math.min(
      this.battleY,
      (state.waterLevel / balance.initialMountain) * this.battleY * 0.92
    );
    const waterSurfaceY = this.battleY - waterH;
    const displayMountainH = this.mountainTexH * scale;
    const peakY = this.battleY - displayMountainH + 18;

    this.mountainImg.setScale(scale * 0.95, scale);
    this.kingHungImg.setPosition(w / 2, this.battleY - displayMountainH + 6);

    if (victory) {
      const lowWater = this.battleY * 0.22;
      this.waterImg.setDisplaySize(w, Math.max(1, lowWater));
      this.heroImg.setPosition(this.sonTinhX, peakY);
      this.miImg.setPosition(this.sonTinhX + 40, peakY - 4);
      this.bossImg.setPosition(this.thuyTinhX + 36, this.battleY - 24).setAlpha(0.22);
      this.clashLine.clear().setAlpha(0);
      this.cameras.main.flash(400, 255, 234, 167);
    } else {
      this.heroImg.setPosition(this.sonTinhX, waterSurfaceY - 48);
      this.miImg.setPosition(this.sonTinhX + 52, waterSurfaceY - 2);
      this.bossImg.setPosition(this.miX + 44, waterSurfaceY - 6).setAlpha(1);
      this.clashLine.clear();
      this.clashLine.lineStyle(3, 0xe74c3c, 0.85);
      this.clashLine.lineBetween(this.miX, waterSurfaceY - 50, this.miX + 48, waterSurfaceY - 8);
      this.clashLine.setAlpha(1);
      this.cameras.main.shake(500, 0.018);
      this.cameras.main.flash(350, 116, 185, 255);
    }
    this._fadeStormOnEnd();
    this._clearInvasionArmy();
  }

  _fadeStormOnEnd() {
    if (!this.stormView?.root) return;
    if (this.stormView.overlay) {
      this.tweens.add({
        targets: this.stormView.overlay,
        alpha: 0.03,
        duration: 700,
        ease: 'Sine.easeOut',
      });
    }
    this.tweens.add({
      targets: this.stormView.root,
      alpha: 0.3,
      duration: 700,
      ease: 'Sine.easeOut',
    });
  }

  _hideGameplayUi() {
    this.laneTrack?.setVisible(false);
    this.hitZone?.setVisible(false);
    this.laneLine?.setVisible(false);
    this.phaseBanner?.setVisible(false);
    this.actBanner?.setVisible(false);
    this.pauseBtnBg?.setVisible(false);
    this.pauseBtnLabel?.setVisible(false);
    this.stopBtnBg?.setVisible(false);
    this.stopBtnLabel?.setVisible(false);
    this.muteToggle?.root.setVisible(false);
    this.feedbackText?.setVisible(false);
    this.gapBarBg?.setVisible(false);
    this.gapBarFill?.setVisible(false);
    this.gapText?.setVisible(false);
    this.balanceBarBg?.setVisible(false);
    this.balanceSonFill?.setVisible(false);
    this.balanceThuyFill?.setVisible(false);
    this.balanceSonLabel?.setVisible(false);
    this.balanceThuyLabel?.setVisible(false);
    this.comboText?.setVisible(false);
    this.timerText?.setVisible(false);
    this.noteSprites.forEach((s) => s.destroy());
    this.noteSprites.clear();
  }

  /** @param {import('./core/GameState.js').GameState} state @param {number} dt */
  _syncBattlefield(state, dt) {
    const w = this.cameras.main.width;
    const scale = 0.65 + (state.mountainPeak / balance.initialMountain) * 0.45;
    const sx = scale * 0.95;
    if (Math.abs(sx - this._viewCache.mountainScale) > 0.01) {
      this._viewCache.mountainScale = sx;
      this.mountainImg.setScale(sx, scale);
    }

    const waterH = Math.min(
      this.battleY,
      (state.waterLevel / balance.initialMountain) * this.battleY * 0.92
    );
    const waterSurfaceY = this.battleY - waterH;

    if (Math.abs(waterH - this._viewCache.waterH) >= 1) {
      this._viewCache.waterH = waterH;
      this.waterImg.setDisplaySize(w, Math.max(1, waterH));
      this.waterImg.y = this.battleY;
    }

    if (Math.abs(waterSurfaceY - this._viewCache.waterSurfaceY) >= 0.5) {
      this._viewCache.waterSurfaceY = waterSurfaceY;
    }

    const displayMountainH = this.mountainTexH * scale;
    this.kingHungImg.setPosition(w / 2, this.battleY - displayMountainH + 6);
    this.kingHungImg.setScale(scale * 0.82);

    const procession = state.elapsed < balance.storyProcessionSeconds;
    const peakY = this.battleY - displayMountainH + 18;
    const danger = state.dangerRatio;
    const miPos = this.battleCamera?.getMiPosition(state, peakY, waterSurfaceY) ?? {
      x: this.miX,
      y: waterSurfaceY - 2,
      besideSon: false,
    };

    if (procession) {
      this.heroImg.setPosition(this.sonTinhX, peakY);
      this.heroAura.setPosition(this.sonTinhX, peakY + 8);
      this.miImg.setPosition(miPos.x, miPos.y);
      this.bossImg.setPosition(this.thuyTinhX + 24, waterSurfaceY - 2).setAlpha(0.32);
      this.clashLine.clear().setAlpha(0);
      this.miImg.setScale(1.06);
      this.miImg.setFlipX(false);
      this.battleCamera?.update(state, dt);
      return;
    }

    const sonLift = 58 + (state.safetyGap / balance.initialMountain) * 25;
    this.heroImg.setPosition(this.sonTinhX, waterSurfaceY - sonLift);
    this.heroAura.setPosition(this.sonTinhX, waterSurfaceY - sonLift + 8);

    this.miImg.setPosition(miPos.x, miPos.y);

    const bossAdvance = danger * 28;
    this.bossImg.setPosition(this.thuyTinhX - bossAdvance, waterSurfaceY - 2);

    const clashA = danger > 0.35 ? Math.min(0.75, 0.25 + danger * 0.55) : 0;
    const clashKey = `${clashA.toFixed(2)}|${waterSurfaceY.toFixed(0)}|${bossAdvance.toFixed(0)}`;
    if (clashKey !== this._viewCache.clashKey) {
      this._viewCache.clashKey = clashKey;
      this.clashLine.clear();
      if (clashA > 0) {
        const miTop = waterSurfaceY - 58;
        const bossTop = waterSurfaceY - 62;
        this.clashLine.lineStyle(3, 0xe74c3c, clashA);
        this.clashLine.lineBetween(this.miX + 22, miTop, this.thuyTinhX - bossAdvance - 28, bossTop);
        this.clashLine.lineStyle(2, 0xf1c40f, clashA * 0.6);
        this.clashLine.lineBetween(this.miX, waterSurfaceY - 8, this.thuyTinhX - bossAdvance, waterSurfaceY - 6);
      }
      this.clashLine.setAlpha(clashA > 0 ? 1 : 0);
    }

    if (state.isFlashFlood !== this._viewCache.flashFlood) {
      this._viewCache.flashFlood = state.isFlashFlood;
      this.floodWave.setVisible(state.isFlashFlood);
    }
    if (state.isFlashFlood) {
      this.floodWave.y = waterSurfaceY;
      this.floodWave.setDisplaySize(w * 0.95, 16);
    }

    const bossA = state.currentAct >= 2 ? 1 : 0.55 + state.elapsed / 90;
    if (Math.abs(bossA - this._viewCache.bossAlpha) > 0.02) {
      this._viewCache.bossAlpha = bossA;
      this.bossImg.setAlpha(bossA);
    }

    this.miImg.setFlipX(miPos.besideSon ? false : danger > 0.4);
    if (danger > 0.45) {
      this.miImg.setScale(1.08 + danger * 0.06, 1.08);
    } else {
      this.miImg.setScale(1.08);
    }

    this.battleCamera?.update(state, dt);
  }

  /** @param {import('./core/GameState.js').GameState} state */
  _syncHud(state) {
    const ratio = Math.max(0, Math.min(1, state.safetyGap / balance.initialMountain));
    const barW = 296 * ratio;
    if (Math.abs(barW - this._viewCache.gapBarWidth) >= 1) {
      this._viewCache.gapBarWidth = barW;
      this.gapBarFill.width = barW;
    }

    const color =
      ratio > 0.5
        ? hexToNum(palettes.ui.barTop)
        : ratio > 0.25
          ? 0xfdcb6e
          : 0xe17055;
    if (color !== this._viewCache.gapBarColor) {
      this._viewCache.gapBarColor = color;
      this.gapBarFill.setFillStyle(color);
    }

    const gapLabel = `Gap: ${Math.floor(state.safetyGap)}m | Water ↔ Ngoc Hoa`;
    if (gapLabel !== this._viewCache.gapText) {
      this._viewCache.gapText = gapLabel;
      this.gapText.setText(gapLabel);
    }

    const sonPct = Phaser.Math.Clamp(state.gapRatio, 0, 1);
    const thuyPct = 1 - sonPct;
    const bw = this._balanceBarW ?? 168;
    const sonW = bw * sonPct;
    const thuyW = bw * thuyPct;
    if (Math.abs(sonW - this._viewCache.balanceSonW) >= 0.5) {
      this._viewCache.balanceSonW = sonW;
      this.balanceSonFill.width = sonW;
    }
    if (Math.abs(thuyW - this._viewCache.balanceThuyW) >= 0.5) {
      this._viewCache.balanceThuyW = thuyW;
      this.balanceThuyFill.width = thuyW;
    }

    if (state.combo !== this._viewCache.combo) {
      this._viewCache.combo = state.combo;
      this.comboText.setText(`x${state.combo}`);
    }

    if (state.isComboLocked !== this._viewCache.comboLocked) {
      this._viewCache.comboLocked = state.isComboLocked;
      this.comboText.setColor(state.isComboLocked ? '#E17055' : '#FFEAA7');
    }

    const remain = Math.max(0, Math.ceil(state.sessionDuration - state.elapsed));
    if (remain !== this._viewCache.timer) {
      this._viewCache.timer = remain;
      this.timerText.setText(`${remain}s`);
    }

    const badge =
      this.gameLevel >= 3
        ? `Level Max · ${this.controller.state.levelCfg.label ?? 'Final Stand'}`
        : this.gameLevel >= 2
          ? `Level ${this.gameLevel} · ${this.controller.state.levelCfg.label ?? 'Storm'}`
          : '';
    if (this.levelBadge.text !== badge) {
      this.levelBadge.setText(badge).setVisible(badge.length > 0);
    }
  }

  _syncNotes() {
    const notes = this.controller.rhythm.getActiveNotes();
    const activeIds = new Set(notes.map((n) => n.id));

    for (const [id, spr] of this.noteSprites) {
      if (!activeIds.has(id)) {
        spr.destroy();
        this.noteSprites.delete(id);
      }
    }

    for (const note of notes) {
      let spr = this.noteSprites.get(note.id);
      const frame = NOTE_FRAME[note.type] || 'note_earth';
      if (!spr) {
        spr = this.add.image(note.x, this.laneY, 'game_assets', frame).setScale(0.9).setDepth(11);
        spr.setData('frame', frame);
        this.noteSprites.set(note.id, spr);
      }
      spr.x = note.x;
      spr.y = note.y;
      if (note.holding) {
        spr.setScale(1.08);
        spr.setAlpha(0.92);
      } else {
        spr.setScale(0.9);
        spr.setAlpha(1);
      }
      if (spr.getData('frame') !== frame) {
        spr.setFrame(frame);
        spr.setData('frame', frame);
      }
    }
  }

  /** @param {import('./core/GameState.js').GameState} state */
  _syncInk(state) {
    if (state.isBlinded && !this._wasBlinded) {
      this._wasBlinded = true;
      this.inkFading = false;
      this.tweens.killTweensOf(this.inkOverlay);
      this.inkOverlay.setPosition(this.cameras.main.width / 2, this.laneY);
      this.inkOverlay.setVisible(true);
      this.inkOverlay.setAlpha(1);
    } else if (!state.isBlinded && this._wasBlinded) {
      this._wasBlinded = false;
      if (!this.inkFading) {
        this.inkFading = true;
        this.tweens.add({
          targets: this.inkOverlay,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            this.inkOverlay.setVisible(false);
            this.inkFading = false;
          },
        });
      }
    }
  }

  /** @param {import('./core/GameState.js').GameState} state */
  _syncPhaseVisual(state, phaseChanged) {
    const labels = {
      calm: 'Breathe — enjoy the view',
      rise: 'Rising tide!',
      climax: 'Surge!',
    };
    const phase = state.intensityPhase;
    if (phase !== this._viewCache.lastPhase || phaseChanged) {
      this._viewCache.lastPhase = phase;
      this.phaseBanner.setText(labels[phase] || '');
      if (phaseChanged && phase === 'calm') {
        this.cameras.main.flash(200, 255, 234, 167);
        this._clearInvasionArmy();
      } else if (phaseChanged && phase === 'climax') {
        this.cameras.main.flash(180, 116, 185, 255);
      }
    }

    if (this.laneTrack) {
      const trackAlpha = state.isCalmPhase ? 0.28 : 0.18;
      this.laneTrack.setFillStyle(0xffffff, trackAlpha);
    }
  }

  /** @param {import('./core/GameState.js').GameState} state */
  _syncHeroAura(state) {
    const show = state.combo >= 8;
    const alpha = show ? Math.min(0.35, state.combo * 0.025) : 0;
    if (alpha !== this._viewCache.auraAlpha) {
      this._viewCache.auraAlpha = alpha;
      this.heroAura.setFillStyle(0xf1c40f, alpha);
      this.heroAura.setStrokeStyle(2, 0xfdcb6e, alpha > 0 ? 0.6 : 0);
    }
  }

  /** @param {import('./core/GameState.js').GameState} state */
  _syncActBanner(state) {
    const act = state.actConfig;
    const key = state.elapsed >= act.start && state.elapsed < act.start + 2 ? act.name : '';
    if (key === this._viewCache.actBannerKey) return;
    this._viewCache.actBannerKey = key;
    if (key) {
      this.actBanner.setText(key).setAlpha(1);
    } else {
      this.actBanner.setAlpha(0);
    }
  }

  /**
   * @param {string} beastId
   */
  _showBeast(beastId) {
    const frame = `beast_${beastId}`;
    const spr = this.add
      .image(this.cameras.main.width / 2, this.battleY - 120, 'game_assets', frame)
      .setScale(1.5)
      .setAlpha(0);
    this.tweens.add({
      targets: spr,
      alpha: 1,
      scale: 2,
      duration: 300,
      yoyo: true,
      hold: 400,
      onComplete: () => spr.destroy(),
    });
    const names = { chicken: 'Nine-Spur Rooster!', elephant: 'Nine-Tusk Elephant!', horse: 'Crimson Horse!' };
    this._showFeedback(names[beastId] || beastId, '#ffaa00');
  }

  shutdown() {
    this.scale.off(Phaser.Scale.Events.RESIZE, this._layoutSafeHud, this);
    this.battleCamera?.reset();
    this.battleCamera = null;
    this.stormView?.destroy();
    this.stormView = null;
    this.lightningView?.destroy();
    this.lightningView = null;
    this.charmThrowView?.destroy();
    this.charmThrowView = null;
    bgmController.stopAmbient();
    this.scenery?.destroy();
    this._clearInvasionArmy();
    this.noteSprites.forEach((s) => s.destroy());
    this.noteSprites.clear();
  }
}
