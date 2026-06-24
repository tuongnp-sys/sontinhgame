import Phaser from 'phaser';
import { preloadAudioAssets, registerLoadedTracks } from './audio/BgmController.js';
import { applyMutedPreference } from './audio/audioPreferences.js';

/**
 * BootScene — tạo Texture Atlas `game_assets` và preload tài nguyên.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const w = this.cameras.main.width;
    const bar = this.add.rectangle(w / 2, 400, 200, 12, 0x222222);
    const fill = this.add.rectangle(w / 2 - 98, 400, 4, 8, 0x44aa66).setOrigin(0, 0.5);

    this.load.on('progress', (v) => {
      fill.width = 196 * v;
    });

    this.load.on('loaderror', (file) => {
      if (file.type === 'audio') {
        console.warn(`[Audio] Missing: public/audio/${file.url}`);
      }
      if (file.key === 'victory_couple') {
        console.warn('[Image] Missing: public/images/sontinh_ngochoa.png — using sprite fallback');
      }
    });

    preloadAudioAssets(this);
    this.load.image('victory_couple', './images/sontinh_ngochoa.png');
  }

  create() {
    this._buildAtlas();
    registerLoadedTracks(this);
    applyMutedPreference();
    this.scene.start('MenuScene');
  }

  /** Tạo atlas game_assets bằng graphics — sẵn sàng thay bằng spritesheet.png sau */
  _buildAtlas() {
    const frames = {};

    const defs = [
      { key: 'mountain', w: 240, h: 320, draw: (g) => {
        g.fillStyle(0x5d4e37, 1);
        g.beginPath();
        g.moveTo(12, 318);
        g.lineTo(228, 318);
        g.lineTo(178, 118);
        g.lineTo(62, 118);
        g.closePath();
        g.fillPath();
        g.fillStyle(0x7a6a4f, 1);
        g.beginPath();
        g.moveTo(28, 318);
        g.lineTo(212, 318);
        g.lineTo(168, 165);
        g.lineTo(72, 165);
        g.closePath();
        g.fillPath();
        g.fillStyle(0x4a7c59, 1);
        g.beginPath();
        g.moveTo(42, 318);
        g.lineTo(198, 318);
        g.lineTo(158, 210);
        g.lineTo(82, 210);
        g.closePath();
        g.fillPath();
        g.fillStyle(0x8d6e63, 1);
        g.fillRect(92, 108, 56, 38);
        g.fillStyle(0xc0392b, 1);
        g.beginPath();
        g.moveTo(86, 108);
        g.lineTo(120, 58);
        g.lineTo(154, 108);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xbdc3c7, 1);
        g.fillRect(114, 68, 12, 48);
        g.fillStyle(0xf1c40f, 1);
        g.fillRect(108, 78, 24, 6);
      }},
      { key: 'king_hung', w: 40, h: 52, draw: (g) => {
        g.fillStyle(0xf1c40f, 1);
        g.fillRect(6, 0, 28, 10);
        g.fillTriangle(20, 0, 14, 8, 26, 8);
        g.fillStyle(0xffeaa7, 1);
        g.fillCircle(20, 20, 11);
        g.fillStyle(0x9b59b6, 1);
        g.fillRect(10, 30, 20, 22);
        g.fillStyle(0xf1c40f, 1);
        g.fillRect(14, 34, 12, 14);
        g.lineStyle(2, 0xe17055, 1);
        g.lineBetween(30, 38, 38, 32);
      }},
      { key: 'water', w: 375, h: 140, draw: (g) => {
        g.fillStyle(0x48dbfb, 0.75);
        g.fillRect(0, 20, 375, 120);
        g.fillStyle(0x2980b9, 0.5);
        g.fillRect(0, 60, 375, 80);
        g.fillStyle(0xffffff, 0.35);
        for (let i = 0; i < 10; i++) {
          g.fillEllipse(i * 42 + 10, 25 + (i % 3) * 18, 36, 10);
          g.fillEllipse(i * 42 + 30, 70 + (i % 2) * 12, 28, 7);
        }
      }},
      { key: 'hero_sontinh', w: 56, h: 80, draw: (g) => {
        g.fillStyle(0x2d3436, 1);
        g.fillCircle(28, 12, 11);
        g.fillStyle(0xffeaa7, 1);
        g.fillCircle(28, 14, 10);
        g.fillStyle(0x27ae60, 1);
        g.fillRect(18, 24, 20, 32);
        g.fillStyle(0x1b5e20, 1);
        g.lineStyle(2, 0x1b5e20);
        g.strokeRect(18, 24, 20, 32);
        g.fillStyle(0x8d6e63, 1);
        g.fillRect(40, 10, 5, 50);
        g.fillStyle(0xf1c40f, 1);
        g.fillCircle(42, 8, 5);
        g.fillStyle(0x2d3436, 1);
        g.fillRect(14, 56, 8, 18);
        g.fillRect(34, 56, 8, 18);
      }},
      { key: 'hero_minuong', w: 48, h: 72, draw: (g) => {
        g.fillStyle(0xffccdd, 1);
        g.fillCircle(24, 12, 9);
        g.fillStyle(0xff88aa, 1);
        g.beginPath();
        g.moveTo(24, 20);
        g.lineTo(8, 72);
        g.lineTo(40, 72);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xfd79a8, 1);
        g.fillTriangle(24, 22, 10, 45, 38, 45);
        g.fillStyle(0xf1c40f, 1);
        g.fillRect(20, 18, 8, 4);
      }},
      { key: 'note_earth', w: 32, h: 32, draw: (g) => {
        g.fillStyle(0xfdcb6e, 1);
        g.fillCircle(16, 16, 14);
        g.lineStyle(2, 0xe17055, 0.8);
        g.strokeCircle(16, 16, 12);
      }},
      { key: 'note_wood', w: 32, h: 32, draw: (g) => {
        g.fillStyle(0x8d6e63, 1);
        g.fillCircle(16, 16, 14);
        g.lineStyle(2, 0x5d4037, 0.8);
        g.strokeCircle(16, 16, 12);
      }},
      { key: 'note_fire', w: 32, h: 32, draw: (g) => {
        g.fillStyle(0xe17055, 1);
        g.fillCircle(16, 16, 14);
        g.lineStyle(2, 0xd63031, 0.8);
        g.strokeCircle(16, 16, 12);
      }},
      { key: 'note_poison', w: 32, h: 32, draw: (g) => {
        g.fillStyle(0x00b894, 1);
        g.fillCircle(16, 16, 14);
        g.lineStyle(3, 0x006644);
        g.strokeCircle(16, 16, 11);
        g.lineStyle(2, 0xffffff, 0.6);
        g.lineBetween(10, 10, 22, 22);
      }},
      { key: 'note_hold', w: 32, h: 32, draw: (g) => {
        g.fillStyle(0x9b59b6, 1);
        g.fillRoundedRect(6, 10, 20, 12, 4);
        g.fillStyle(0xf1c40f, 1);
        g.fillCircle(16, 8, 5);
      }},
      { key: 'ui_hit_zone', w: 64, h: 64, draw: (g) => {
        g.lineStyle(4, 0xfdcb6e, 0.95);
        g.strokeCircle(32, 32, 26);
        g.lineStyle(2, 0xe17055, 0.6);
        g.strokeCircle(32, 32, 18);
      }},
      { key: 'beast_chicken', w: 44, h: 44, draw: (g) => {
        g.fillStyle(0xf39c12, 1);
        g.fillCircle(22, 24, 16);
        g.fillStyle(0xe74c3c, 1);
        g.fillCircle(22, 12, 10);
        g.fillStyle(0xf1c40f, 1);
        g.fillTriangle(30, 10, 38, 14, 30, 16);
      }},
      { key: 'beast_elephant', w: 52, h: 44, draw: (g) => {
        g.fillStyle(0x95a5a6, 1);
        g.fillEllipse(26, 26, 44, 30);
        g.fillStyle(0x7f8c8d, 1);
        g.fillEllipse(10, 20, 12, 18);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(36, 18, 3);
      }},
      { key: 'beast_horse', w: 52, h: 40, draw: (g) => {
        g.fillStyle(0xe74c3c, 1);
        g.fillEllipse(26, 22, 46, 26);
        g.fillStyle(0xc0392b, 1);
        g.fillEllipse(38, 14, 14, 12);
        g.lineStyle(3, 0xf1c40f, 1);
        g.lineBetween(20, 8, 28, 16);
      }},
      { key: 'monster_fish', w: 40, h: 32, draw: (g) => {
        g.fillStyle(0x3498db, 1);
        g.fillEllipse(20, 16, 34, 20);
        g.fillStyle(0x2980b9, 1);
        g.fillTriangle(4, 16, 12, 8, 12, 24);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(30, 12, 3);
        g.fillStyle(0x2d3436, 1);
        g.fillCircle(31, 12, 1.5);
      }},
      { key: 'boss_thuytinh', w: 72, h: 88, draw: (g) => {
        g.fillStyle(0x48dbfb, 0.5);
        g.fillEllipse(36, 78, 68, 18);
        g.fillStyle(0x2980b9, 1);
        g.fillRect(20, 28, 32, 52);
        g.fillStyle(0x74b9ff, 1);
        g.fillCircle(36, 22, 16);
        g.fillStyle(0xaaddff, 0.7);
        g.fillEllipse(36, 10, 20, 10);
        g.fillStyle(0xe74c3c, 1);
        g.fillCircle(30, 20, 3);
        g.fillCircle(42, 20, 3);
        g.lineStyle(2, 0x1a5276, 0.6);
        g.strokeEllipse(36, 78, 68, 18);
      }},
      { key: 'ink_blob', w: 80, h: 80, draw: (g) => {
        g.fillStyle(0x2d3436, 0.92);
        g.fillCircle(40, 40, 38);
        g.fillStyle(0x000000, 0.4);
        g.fillCircle(50, 35, 20);
      }},
      { key: 'wave_crest', w: 80, h: 16, draw: (g) => {
        g.fillStyle(0xffffff, 0.45);
        g.fillEllipse(40, 8, 70, 10);
      }},
    ];

    let x = 0;
    let y = 0;
    let rowH = 0;
    const pad = 2;
    const maxW = 512;

    for (const def of defs) {
      if (x + def.w > maxW) {
        x = 0;
        y += rowH + pad;
        rowH = 0;
      }
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      def.draw(g);
      const rt = g.generateTexture(`__tmp_${def.key}`, def.w, def.h);
      g.destroy();

      frames[def.key] = { x, y, w: def.w, h: def.h };
      x += def.w + pad;
      rowH = Math.max(rowH, def.h);
    }

    const atlasH = y + rowH;
    const canvas = this.textures.createCanvas('game_assets', maxW, atlasH);
    const ctx = canvas.getContext();

    for (const def of defs) {
      const f = frames[def.key];
      const src = this.textures.get(`__tmp_${def.key}`).getSourceImage();
      ctx.drawImage(src, f.x, f.y);
      this.textures.remove(`__tmp_${def.key}`);
    }

    for (const [key, f] of Object.entries(frames)) {
      canvas.add(key, 0, f.x, f.y, f.w, f.h);
    }
    canvas.refresh();
  }
}
