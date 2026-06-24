import poemData from '../data/content/poem-ngochoa.json';
import styles from '../data/content/contentStyles.json';
import { buildPoemBody } from './contentRender.js';

const SCROLL_PX_PER_SEC = 20;
const FIREWORK_COLORS = [0xf1c40f, 0xe74c3c, 0x9b59b6, 0x48dbfb, 0xff88aa];
const LANG_KEY = 'sontinh_poem_lang';

/**
 * Victory finale — night sky, fireworks, couple image, bilingual poem scroll.
 */
export class VictoryFinaleView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   */
  constructor(scene, w, h) {
    this.scene = scene;
    this.w = w;
    this.h = h;
    this.lang = localStorage.getItem(LANG_KEY) || 'both';
    this._scrollTween = null;
    this._fireworkTimer = null;
    this._bursts = [];
    this._scrollContent = null;

    this.root = scene.add.container(0, 0).setDepth(50);

    this._buildNightSky();
    this._buildStars();
    this._buildCoupleImage();
    this._startFireworks();
    this._buildPoemScroll();
    this._buildLangToggle();
  }

  _buildNightSky() {
    const sky = this.scene.add
      .rectangle(this.w / 2, this.h * 0.36, this.w, this.h * 0.72, 0x0a1628, 0.62);
    this.root.add(sky);
  }

  _buildStars() {
    for (let i = 0; i < 55; i++) {
      const star = this.scene.add.circle(
        Phaser.Math.Between(8, this.w - 8),
        Phaser.Math.Between(12, this.h * 0.48),
        Phaser.Math.FloatBetween(0.8, 2.2),
        0xffffff,
        Phaser.Math.FloatBetween(0.35, 0.95)
      );
      this.root.add(star);
      this.scene.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: Phaser.Math.FloatBetween(0.15, 0.5) },
        duration: Phaser.Math.Between(600, 2200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1500),
      });
    }
  }

  _buildCoupleImage() {
    const hasImg = this.scene.textures.exists('victory_couple');
    const targetY = this.h * 0.26;
    const maxW = this.w * 0.88;

    if (hasImg) {
      const img = this.scene.add.image(this.w / 2, targetY + 30, 'victory_couple').setAlpha(0);
      const scale = Math.min(maxW / img.width, (this.h * 0.32) / img.height);
      img.setScale(scale * 0.92);
      this.root.add(img);
      this.scene.tweens.add({
        targets: img,
        alpha: 1,
        y: targetY,
        scale,
        duration: 900,
        ease: 'Back.easeOut',
      });
    } else {
      const groom = this.scene.add
        .image(this.w / 2 - 20, targetY, 'game_assets', 'hero_sontinh')
        .setScale(1.2)
        .setAlpha(0);
      const bride = this.scene.add
        .image(this.w / 2 + 24, targetY - 4, 'game_assets', 'hero_minuong')
        .setScale(1.05)
        .setAlpha(0);
      this.root.add([groom, bride]);
      this.scene.tweens.add({
        targets: [groom, bride],
        alpha: 1,
        duration: 700,
      });
    }

    const bless = this.scene.add
      .text(this.w / 2, this.h * 0.42, '✦ Blessed union ✦', {
        fontFamily: styles.fonts.title,
        fontSize: '13px',
        fontStyle: 'italic',
        color: '#FFEAA7',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.root.add(bless);
    this.scene.tweens.add({
      targets: bless,
      alpha: 1,
      duration: 1200,
      delay: 400,
    });
  }

  _startFireworks() {
    const spawn = () => {
      const x = Phaser.Math.Between(30, this.w - 30);
      const y = Phaser.Math.Between(40, this.h * 0.4);
      const color = Phaser.Utils.Array.GetRandom(FIREWORK_COLORS);
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        const spark = this.scene.add.circle(x, y, 2.5, color, 0.95);
        this.root.add(spark);
        this._bursts.push(spark);
        this.scene.tweens.add({
          targets: spark,
          x: x + Math.cos(angle) * Phaser.Math.Between(28, 52),
          y: y + Math.sin(angle) * Phaser.Math.Between(28, 52),
          alpha: 0,
          scale: 0.2,
          duration: Phaser.Math.Between(500, 900),
          ease: 'Quad.easeOut',
          onComplete: () => {
            spark.destroy();
            const idx = this._bursts.indexOf(spark);
            if (idx >= 0) this._bursts.splice(idx, 1);
          },
        });
      }
    };

    spawn();
    this._fireworkTimer = this.scene.time.addEvent({
      delay: Phaser.Math.Between(700, 1400),
      loop: true,
      callback: spawn,
    });
  }

  _buildPoemScroll() {
    const frameW = this.w - 32;
    const frameH = 188;
    this._frameW = frameW;
    this._frameY = this.h * 0.66;
    const frameTop = this._frameY - frameH / 2;
    const frameBottom = this._frameY + frameH / 2;

    const frameBg = this.scene.add
      .rectangle(this.w / 2, this._frameY, frameW, frameH, 0xfff8e7, 0.96)
      .setStrokeStyle(3, 0xf1c40f, 1);
    this.root.add(frameBg);

    this.titleText = this.scene.add
      .text(this.w / 2, frameTop + 12, poemData.title.vn, {
        fontFamily: styles.fonts.body,
        fontSize: styles.sizes.poemTitle,
        fontStyle: 'italic bold',
        color: styles.palette.poemTitle,
      })
      .setOrigin(0.5, 0);
    this.root.add(this.titleText);

    const maskShape = this.scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(this.w / 2 - frameW / 2 + 8, frameTop + 30, frameW - 16, frameH - 40);
    this._mask = maskShape.createGeometryMask();
    this._frameTop = frameTop + 30;
    this._frameBottom = frameBottom - 8;

    this.scrollLayer = this.scene.add.container(0, 0).setMask(this._mask);
    this.root.add(this.scrollLayer);

    this._rebuildPoemContent();
  }

  _rebuildPoemContent() {
    this._scrollContent?.destroy(true);
    const mode = this.lang;
    if (mode === 'both') {
      this.titleText.setText(`${poemData.title.vn}\n${poemData.title.en}`);
      this.titleText.setAlign('center');
      this.titleText.setLineSpacing(4);
    } else {
      this.titleText.setText(poemData.title[mode]);
      this.titleText.setLineSpacing(0);
    }

    const { container, height } = buildPoemBody(
      this.scene,
      this.w / 2 - this._frameW / 2 + 12,
      0,
      this._frameW - 24,
      poemData,
      mode
    );
    this._scrollContent = container;
    this._contentHeight = height;
    this.scrollLayer.add(container);
    this._startScrollLoop();
  }

  _startScrollLoop() {
    if (this._scrollTween) {
      this._scrollTween.stop();
      this._scrollTween = null;
    }

    const startY = this._frameBottom;
    const endY = this._frameTop - this._contentHeight;
    this._scrollContent.y = startY;
    if (endY >= startY - 4) return;

    const duration = Math.max(10000, ((startY - endY) / SCROLL_PX_PER_SEC) * 1000);

    this._scrollTween = this.scene.tweens.add({
      targets: this._scrollContent,
      y: endY,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this._scrollContent.y = startY;
        this._startScrollLoop();
      },
    });
  }

  _buildLangToggle() {
    const y = this.h * 0.66 - 104;
    const mkBtn = (label, lang, x, w = 40) => {
      const active = this.lang === lang;
      const bg = this.scene.add
        .rectangle(x, y, w, 26, active ? 0x1b7f4a : 0xffffff, active ? 1 : 0.7)
        .setStrokeStyle(2, 0x1b7f4a, 1)
        .setInteractive({ useHandCursor: true });
      const txt = this.scene.add
        .text(x, y, label, {
          fontFamily: styles.fonts.ui,
          fontSize: '11px',
          fontStyle: 'bold',
          color: active ? '#ffffff' : '#1B7F4A',
        })
        .setOrigin(0.5);
      bg.on('pointerdown', () => this.setLanguage(lang));
      this.root.add([bg, txt]);
      return { bg, txt, lang };
    };

    this._langBtns = [
      mkBtn('VN', 'vn', this.w / 2 - 52),
      mkBtn('BOTH', 'both', this.w / 2, 44),
      mkBtn('EN', 'en', this.w / 2 + 52),
    ];
  }

  /**
   * @param {'vn'|'en'|'both'} lang
   */
  setLanguage(lang) {
    if (lang === this.lang) return;
    this.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    this._rebuildPoemContent();
    for (const b of this._langBtns) {
      const active = b.lang === lang;
      b.bg.setFillStyle(active ? 0x1b7f4a : 0xffffff, active ? 1 : 0.7);
      b.txt.setColor(active ? '#ffffff' : '#1B7F4A');
    }
  }

  destroy() {
    if (this._scrollTween) this._scrollTween.stop();
    if (this._fireworkTimer) this._fireworkTimer.destroy();
    for (const s of this._bursts) s.destroy();
    this._bursts = [];
    this.root.destroy(true);
  }
}
