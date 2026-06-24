import audioConfig from '../data/audio.json';
import { audioManager } from './AudioManager.js';

/** @typedef {'menu'|'gameplay'|'victory'|'defeat'|'ngochoa'|'rain'} BgmTrackId */

const AMBIENT_DUCK_RATIO = 0.28;
const NGOCHOA_FADE_MS = 500;
const BGM_DUCK_RATIO = 0.22;

/**
 * Phát nhạc nền MP3 qua Phaser Sound.
 * Mute/unmute chỉ đổi volume — không restart track.
 */
class BgmController {
  constructor() {
    /** @type {Set<string>} */
    this._available = new Set();
    /** @type {Phaser.Game|null} */
    this._game = null;
    /** @type {Phaser.Scene|null} */
    this._scene = null;
    /** @type {Phaser.Sound.BaseSound|null} */
    this._sound = null;
    /** @type {BgmTrackId|null} */
    this._trackId = null;
    /** @type {BgmTrackId|null} */
    this._ambientTrackId = null;
    /** @type {Phaser.Sound.BaseSound|null} */
    this._ambientSound = null;
    /** @type {Phaser.Sound.BaseSound|null} */
    this._oneShotSound = null;
    /** @type {BgmTrackId|null} */
    this._oneShotTrackId = null;
    /** @type {number|null} */
    this._bgmRestoreVol = null;
    /** @type {boolean} */
    this._musicFadedForOneShot = false;
    /** @type {Phaser.Tweens.Tween|null} */
    this._musicFadeTween = null;
    this.muted = false;
  }

  /**
   * @param {string} phaserKey
   */
  markAvailable(phaserKey) {
    this._available.add(phaserKey);
  }

  /**
   * @param {BgmTrackId} trackId
   */
  isTrackReady(trackId) {
    const key = audioConfig.tracks[trackId];
    return key ? this._available.has(key) : false;
  }

  /**
   * @param {BgmTrackId} trackId
   */
  _trackVolume(trackId) {
    return audioConfig.volume[trackId] ?? 0.5;
  }

  /**
   * @param {Phaser.Scene} scene
   */
  _stopSceneSounds(scene) {
    if (scene?.sound) {
      scene.sound.stopAll();
    }
  }

  _cancelMusicFade() {
    if (this._musicFadeTween) {
      this._musicFadeTween.stop();
      this._musicFadeTween = null;
    }
  }

  /** @returns {number} */
  _getMusicVolume() {
    if (this.muted || !this._trackId) return 0;
    if (this._musicFadedForOneShot) return 0;
    const full = this._bgmRestoreVol ?? this._trackVolume(this._trackId);
    if (this._ambientSound) return full * AMBIENT_DUCK_RATIO;
    if (this._oneShotSound && this._oneShotTrackId && this._oneShotTrackId !== 'ngochoa') {
      return full * BGM_DUCK_RATIO;
    }
    return full;
  }

  _applyVolumes() {
    if (this._sound && 'setVolume' in this._sound) {
      this._sound.setVolume(this._getMusicVolume());
    }
    if (this._ambientSound && 'setVolume' in this._ambientSound && this._ambientTrackId) {
      this._ambientSound.setVolume(this.muted ? 0 : this._trackVolume(this._ambientTrackId));
    }
    if (this._oneShotSound && 'setVolume' in this._oneShotSound && this._oneShotTrackId) {
      this._oneShotSound.setVolume(this.muted ? 0 : this._trackVolume(this._oneShotTrackId));
    }
  }

  /** Stop audio on every scene — chỉ khi đổi scene/track, không dùng khi toggle mute. */
  _stopAllSceneSounds() {
    const game = this._game ?? this._scene?.game;
    if (game?.scene?.scenes) {
      for (const s of game.scene.scenes) {
        this._stopSceneSounds(s);
      }
    } else if (this._scene) {
      this._stopSceneSounds(this._scene);
    }
    this.stopOneShot();
    this.stopAmbient();
    this.stopMusic();
  }

  /**
   * Fade victory (hoặc BGM hiện tại) xuống 0 khi ngochoa lên.
   * @param {Phaser.Scene} scene
   */
  _fadeMusicForNgochoa(scene) {
    if (!this._sound || !this._trackId) return;
    this._cancelMusicFade();
    const startVol = this.muted
      ? 0
      : (this._bgmRestoreVol ?? this._trackVolume(this._trackId));
    this._musicFadedForOneShot = true;
    const proxy = { vol: startVol };
    this._musicFadeTween = scene.tweens.add({
      targets: proxy,
      vol: 0,
      duration: NGOCHOA_FADE_MS,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        if (this._sound && !this.muted) {
          this._sound.setVolume(proxy.vol);
        }
      },
      onComplete: () => {
        this._musicFadeTween = null;
        this._sound?.setVolume(0);
      },
    });
  }

  /**
   * @param {Phaser.Scene} scene
   * @param {BgmTrackId} trackId
   * @param {{ delayMs?: number }} [opts]
   */
  play(scene, trackId, opts = {}) {
    const key = audioConfig.tracks[trackId];
    if (!key || !this._available.has(key)) {
      if (trackId === 'gameplay') {
        audioManager.unlock({ proceduralMusic: true });
      }
      return;
    }

    const start = () => {
      this._game = scene.game;
      this._stopSceneSounds(scene);
      this.stopMusic();
      this.stopOneShot();
      this._clearAmbientDuck();
      this._scene = scene;
      this._trackId = trackId;
      this._bgmRestoreVol = this._trackVolume(trackId);
      const loop = audioConfig.loop[trackId] ?? false;
      this._sound = scene.sound.add(key, {
        loop,
        volume: this._getMusicVolume(),
      });
      this._sound.play();
      audioManager.setProceduralMusicEnabled(false);
    };

    if (opts.delayMs && opts.delayMs > 0) {
      scene.time.delayedCall(opts.delayMs, start);
    } else {
      start();
    }
  }

  /**
   * @param {Phaser.Scene} scene
   * @param {BgmTrackId} trackId
   * @param {{ duckBgm?: boolean, fadeVictory?: boolean }} [opts]
   */
  playOneShot(scene, trackId, opts = {}) {
    const key = audioConfig.tracks[trackId];
    if (!key || !this._available.has(key)) return;

    this._game = scene.game;
    this.stopOneShot();
    this._oneShotTrackId = trackId;
    const vol = this._trackVolume(trackId);
    const fadeVictory = trackId === 'ngochoa' || opts.fadeVictory === true;
    const duck = !fadeVictory && opts.duckBgm !== false && this._sound && this._trackId;

    if (fadeVictory && this._sound) {
      this._fadeMusicForNgochoa(scene);
    } else if (duck && this._trackId) {
      const full = this._trackVolume(this._trackId);
      this._bgmRestoreVol = full;
      if (!this.muted) {
        this._sound.setVolume(full * BGM_DUCK_RATIO);
      }
    }

    this._oneShotSound = scene.sound.add(key, {
      loop: false,
      volume: this.muted ? 0 : vol,
    });
    this._oneShotSound.once('complete', () => {
      const wasNgochoa = this._oneShotTrackId === 'ngochoa';
      this.stopOneShot();
      if (wasNgochoa) {
        this.stopMusic();
        return;
      }
      if (duck && this._sound && this._trackId && !this.muted) {
        const full = this._bgmRestoreVol ?? this._trackVolume(this._trackId);
        this._sound.setVolume(this._ambientSound ? full * AMBIENT_DUCK_RATIO : full);
      }
    });
    this._oneShotSound.play();
  }

  _applyAmbientDuck() {
    if (!this._sound || !this._trackId || this.muted || this._musicFadedForOneShot) return;
    const full = this._trackVolume(this._trackId);
    this._bgmRestoreVol = full;
    this._sound.setVolume(full * AMBIENT_DUCK_RATIO);
  }

  _clearAmbientDuck() {
    if (this._bgmRestoreVol != null && this._sound && this._trackId && !this.muted && !this._musicFadedForOneShot) {
      this._sound.setVolume(this._bgmRestoreVol);
    }
    this._bgmRestoreVol = null;
  }

  /**
   * @param {Phaser.Scene} scene
   * @param {BgmTrackId} trackId
   */
  playAmbient(scene, trackId) {
    const key = audioConfig.tracks[trackId];
    if (!key || !this._available.has(key)) return;
    this._game = scene.game;
    this.stopAmbient();
    this._ambientTrackId = trackId;
    this._ambientSound = scene.sound.add(key, {
      loop: audioConfig.loop[trackId] ?? true,
      volume: this.muted ? 0 : this._trackVolume(trackId),
    });
    this._ambientSound.play();
    this._applyAmbientDuck();
  }

  stopOneShot() {
    if (this._oneShotSound) {
      this._oneShotSound.stop();
      this._oneShotSound.destroy();
      this._oneShotSound = null;
    }
    this._oneShotTrackId = null;
  }

  stopAmbient() {
    if (this._ambientSound) {
      this._ambientSound.stop();
      this._ambientSound.destroy();
      this._ambientSound = null;
    }
    this._ambientTrackId = null;
    this._clearAmbientDuck();
  }

  stopMusic() {
    this._cancelMusicFade();
    this._musicFadedForOneShot = false;
    if (this._sound) {
      this._sound.stop();
      this._sound.destroy();
      this._sound = null;
    }
    this._trackId = null;
    this._bgmRestoreVol = null;
  }

  stop() {
    this._stopAllSceneSounds();
    this._scene = null;
    audioManager.setProceduralMusicEnabled(true);
  }

  pause() {
    this._sound?.pause();
    this._oneShotSound?.pause();
    audioManager.pause();
  }

  resume() {
    if (!this.muted) {
      this._sound?.resume();
      this._oneShotSound?.resume();
      audioManager.resume();
    }
  }

  /** @param {boolean} muted */
  setMuted(muted) {
    this.muted = muted;
    audioManager.setMuted(muted);
    this._applyVolumes();
  }
}

export const bgmController = new BgmController();

/**
 * Đăng ký track đã load thành công từ BootScene.
 * @param {Phaser.Scene} scene
 */
export function registerLoadedTracks(scene) {
  for (const key of Object.values(audioConfig.tracks)) {
    if (scene.cache.audio.exists(key)) {
      bgmController.markAvailable(key);
    }
  }
}

/**
 * @param {import('phaser').Scene} scene
 */
export function preloadAudioAssets(scene) {
  const base = `./${audioConfig.basePath}`;
  for (const [trackId, filename] of Object.entries(audioConfig.files)) {
    const key = audioConfig.tracks[trackId];
    if (key && filename) {
      scene.load.audio(key, `${base}/${filename}`);
    }
  }
}

/**
 * Dừng nhạc trên scene đang chạy phía dưới overlay (ví dụ GameScene khi GameOver launch).
 * @param {Phaser.Scene} overlayScene
 */
export function stopUnderlyingSceneAudio(overlayScene) {
  const game = overlayScene.game;
  if (!game?.scene?.scenes) return;
  for (const s of game.scene.scenes) {
    if (s !== overlayScene && (s.scene.isActive() || s.scene.isVisible())) {
      s.sound?.stopAll();
    }
  }
}
