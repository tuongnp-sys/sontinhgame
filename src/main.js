import Phaser from 'phaser';
import { BootScene } from './BootScene.js';
import { MenuScene } from './MenuScene.js';
import { HowToPlayScene } from './HowToPlayScene.js';
import { GameScene } from './GameScene.js';
import { GameOverScene } from './GameOverScene.js';
import { platform } from '../platform/index.js';
import { registerGameAccessor, enterSystemPause, exitSystemPause } from './systemPause.js';
import { shouldResumeGameplay } from './gameSession.js';
import { bindScaleRefresh } from './scaleRefit.js';

/** @type {Phaser.Game|null} */
let game = null;

const GAME_WIDTH = 375;
const GAME_HEIGHT = 812;

export function getGame() {
  return game;
}

export function initGame() {
  const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true,
    },
    scene: [BootScene, MenuScene, HowToPlayScene, GameScene, GameOverScene],
    audio: {
      disableWebAudio: false,
    },
    fps: {
      target: 60,
      smoothStep: true,
    },
  };

  game = new Phaser.Game(config);
  registerGameAccessor(() => game);
  bindScaleRefresh(game);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      enterSystemPause('tab_hidden');
    } else if (shouldResumeGameplay()) {
      exitSystemPause();
    }
  });

  platform.gameLoading(0);
  platform.gameLoading(100);
  platform.gameLoaded();
}

initGame();
