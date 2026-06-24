import palettes from '../data/palettes.json';
import { hexToNum } from '../ui/phaserUi.js';

/**
 * Nền sáng nhiều lớp — học MangoRus scenery.js (gradient, đồi, mây, tre).
 */
export class SceneryView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} width
   * @param {number} height
   * @param {number} groundY
   */
  constructor(scene, width, height, groundY) {
    this.scene = scene;
    this.w = width;
    this.h = height;
    this.groundY = groundY;
    this.actIndex = 0;
    this.windT = 0;
    this.scrollT = 0;

    this.root = scene.add.container(0, 0).setDepth(-20);

    this.skyGfx = scene.add.graphics();
    this.hillsGfx = scene.add.graphics();
    this.groundGfx = scene.add.graphics();
    this.decorGfx = scene.add.graphics();

    this.sun = scene.add.circle(width * 0.78, height * 0.12, 28, 0xffecb3, 0.95);
    this.sunGlow = scene.add.circle(width * 0.78, height * 0.12, 42, 0xffecb3, 0.25);

    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const c = scene.add.container(60 + i * 90, 40 + (i % 2) * 25);
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, i % 2 === 0 ? 0.55 : 0.38);
      g.fillCircle(0, 0, 18);
      g.fillCircle(16, -4, 14);
      g.fillCircle(-14, -2, 12);
      c.add(g);
      c.cloudSpeed = 0.012 + i * 0.004;
      c.baseX = c.x;
      this.clouds.push(c);
    }

    this.root.add([
      this.skyGfx,
      this.sunGlow,
      this.sun,
      this.hillsGfx,
      this.groundGfx,
      this.decorGfx,
      ...this.clouds,
    ]);

    this._drawAct(0);
  }

  /**
   * @param {number} actIndex
   */
  setAct(actIndex) {
    if (actIndex === this.actIndex) return;
    this.actIndex = actIndex;
    this._drawAct(actIndex);
    const flash = hexToNum(palettes.acts[actIndex]?.flash ?? '#FFEAA7');
    this.scene.cameras.main.flash(280, (flash >> 16) & 0xff, (flash >> 8) & 0xff, flash & 0xff);
  }

  /**
   * @param {number} actIndex
   */
  _drawAct(actIndex) {
    const pal = palettes.acts[actIndex] ?? palettes.acts[0];
    const skyTop = hexToNum(pal.skyTop);
    const skyBot = hexToNum(pal.skyBottom);
    const hill = hexToNum(pal.hill);
    const ground = hexToNum(pal.ground);
    const accent = hexToNum(pal.groundAccent);

    this.skyGfx.clear();
    this.skyGfx.fillGradientStyle(skyTop, skyTop, skyBot, skyBot, 1);
    this.skyGfx.fillRect(0, 0, this.w, this.groundY + 20);

    this.hillsGfx.clear();
    this.hillsGfx.fillStyle(hill, 0.35);
    this.hillsGfx.beginPath();
    this.hillsGfx.moveTo(0, this.groundY - 20);
    for (let x = 0; x <= this.w; x += 30) {
      const y = this.groundY - 55 - Math.sin(x * 0.018) * 18;
      this.hillsGfx.lineTo(x, y);
    }
    this.hillsGfx.lineTo(this.w, this.groundY);
    this.hillsGfx.lineTo(0, this.groundY);
    this.hillsGfx.closePath();
    this.hillsGfx.fillPath();

    this.groundGfx.clear();
    this.groundGfx.fillStyle(ground, 1);
    this.groundGfx.fillRect(0, this.groundY, this.w, this.h - this.groundY);
    this.groundGfx.fillStyle(accent, 0.45);
    for (let x = 0; x < this.w; x += 24) {
      this.groundGfx.fillRect(x, this.groundY + 8, 12, 6);
    }

    this._drawDecor(actIndex);
  }

  /**
   * @param {number} actIndex
   */
  _drawDecor(actIndex) {
    this.decorGfx.clear();
    const gy = this.groundY;

    // Tre trúc
    for (let i = 0; i < 5; i++) {
      const bx = 30 + i * 75 + (i % 2) * 20;
      this._drawBamboo(this.decorGfx, bx, gy, 0);
    }

    // Đình làng nhỏ
    if (actIndex === 0) {
      this._drawShrine(this.decorGfx, this.w * 0.15, gy - 8);
    }

    // Hoa chấm
    this.decorGfx.fillStyle(0xe84393, 0.7);
    for (let i = 0; i < 8; i++) {
      const fx = (i * 47) % this.w;
      this.decorGfx.fillCircle(fx, gy + 18 + (i % 3) * 8, 3);
    }
  }

  /**
   * @param {Phaser.GameObjects.Graphics} g
   * @param {number} x
   * @param {number} groundY
   * @param {number} sway
   */
  _drawBamboo(g, x, groundY, sway) {
    const h = 55 + (x % 3) * 8;
    g.fillStyle(0x43a047, 1);
    g.fillRect(x - 2 + sway, groundY - h, 4, h);
    g.fillStyle(0x1b5e20, 1);
    g.fillRect(x - 3 + sway, groundY - h + 12, 6, 3);
    g.fillRect(x - 3 + sway, groundY - h + 28, 6, 3);
    g.fillStyle(0x2e7d32, 1);
    g.fillEllipse(x + sway, groundY - h - 6, 14, 8);
  }

  /**
   * @param {Phaser.GameObjects.Graphics} g
   * @param {number} x
   * @param {number} y
   */
  _drawShrine(g, x, y) {
    g.fillStyle(0x8d6e63, 1);
    g.fillRect(x - 18, y - 28, 36, 28);
    g.fillStyle(0xc0392b, 1);
    g.beginPath();
    g.moveTo(x - 22, y - 28);
    g.lineTo(x, y - 48);
    g.lineTo(x + 22, y - 28);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xffeaa7, 1);
    g.fillRect(x - 6, y - 18, 12, 10);
  }

  /**
   * @param {number} dt
   * @param {number} actIndex
   */
  update(dt, actIndex) {
    this.windT += dt;
    this.scrollT += dt * 12;

    if (actIndex !== this.actIndex) {
      this.setAct(actIndex);
    }

    for (const c of this.clouds) {
      c.x = (c.baseX + this.scrollT * c.cloudSpeed * 20) % (this.w + 80);
      if (c.x < -40) c.x += this.w + 80;
    }

    // Tre lắc nhẹ — vẽ lại decor mỗi ~0.1s thay vì mỗi frame
    this._decorTimer = (this._decorTimer ?? 0) + dt;
    if (this._decorTimer >= 0.12) {
      this._decorTimer = 0;
      const sway = Math.sin(this.windT * 1.2) * 2;
      this._drawDecorPartialSway(actIndex, sway);
    }
  }

  /**
   * @param {number} actIndex
   * @param {number} sway
   */
  _drawDecorPartialSway(actIndex, sway) {
    this.decorGfx.clear();
    const gy = this.groundY;
    for (let i = 0; i < 5; i++) {
      const bx = 30 + i * 75 + (i % 2) * 20;
      this._drawBamboo(this.decorGfx, bx, gy, sway * (i % 2 === 0 ? 1 : -0.7));
    }
    if (actIndex === 0) this._drawShrine(this.decorGfx, this.w * 0.15, gy - 8);
    this.decorGfx.fillStyle(0xe84393, 0.7);
    for (let i = 0; i < 8; i++) {
      this.decorGfx.fillCircle((i * 47) % this.w, gy + 18 + (i % 3) * 8, 3);
    }
  }

  destroy() {
    this.root.destroy(true);
  }
}
