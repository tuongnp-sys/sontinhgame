import Phaser from 'phaser';
import { toggleMutedPreference, loadMutedPreference } from '../audio/audioPreferences.js';

/**
 * Nút bật/tắt âm thanh — HUD hoặc menu.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} [depth]
 * @returns {{ root: Phaser.GameObjects.Container, refresh: () => void }}
 */
export function createMuteToggle(scene, x, y, depth = 20) {
  const root = scene.add.container(x, y).setDepth(depth);

  const bg = scene.add
    .circle(0, 0, 18, 0x0a1628, 0.55)
    .setStrokeStyle(2, 0xfdcb6e, 0.85);
  const label = scene.add
    .text(0, 0, loadMutedPreference() ? 'OFF' : 'ON', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#FFEAA7',
    })
    .setOrigin(0.5);
  const icon = scene.add
    .text(0, -1, '♪', {
      fontSize: '14px',
      color: '#FFEAA7',
    })
    .setOrigin(0.5);

  const hit = scene.add
    .circle(0, 0, 20, 0xffffff, 0.001)
    .setInteractive({ useHandCursor: true });

  const refresh = () => {
    const muted = loadMutedPreference();
    icon.setText(muted ? '×' : '♪');
    label.setText(muted ? 'OFF' : 'ON');
    icon.setAlpha(muted ? 0.55 : 1);
  };

  hit.on('pointerdown', () => {
    toggleMutedPreference();
    refresh();
  });
  hit.on('pointerover', () => bg.setFillStyle(0x1b7f4a, 0.75));
  hit.on('pointerout', () => bg.setFillStyle(0x0a1628, 0.55));

  root.add([bg, icon, label, hit]);
  refresh();
  return { root, refresh };
}
