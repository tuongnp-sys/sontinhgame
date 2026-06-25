import Phaser from 'phaser';
import howToData from '../data/content/how-to-play.json';
import styles from '../data/content/contentStyles.json';
import { buildHowToPlayBody } from './contentRender.js';
import { createPillButton } from './phaserUi.js';

const SCROLL_PX_PER_SEC = 16;
const LANG_KEY = 'sontinh_howto_lang';

const TITLE = {
  vn: 'Cách chơi',
  en: 'How to Play',
  both: 'How to Play · Cách chơi',
};

/**
 * Bilingual how-to panel with VN | BOTH | EN toggle.
 */
export class HowToPlayPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   * @param {{ autoStart?: boolean, onBack: () => void, onStart?: () => void }} opts
   */
  constructor(scene, w, h, opts) {
    this.scene = scene;
    this.w = w;
    this.h = h;
    this.opts = opts;
    this.lang = localStorage.getItem(LANG_KEY) || 'both';
    this._scrollTween = null;
    this._scrollContent = null;

    const panelH = h * 0.68;
    const panelTop = h / 2 - panelH / 2;

    this.panelBg = scene.add
      .rectangle(w / 2, h / 2, w - 20, panelH, 0xffffff, 0.92)
      .setStrokeStyle(3, 0xfdcb6e, 1)
      .setDepth(5);

    this.titleText = scene.add
      .text(w / 2, panelTop + 12, TITLE[this.lang], {
        fontFamily: styles.fonts.title,
        fontSize: '17px',
        fontStyle: 'bold',
        color: styles.palette.title,
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(6);

    const langY = panelTop + 40;
    this._buildLangToggle(langY);

    const scrollTop = panelTop + 72;
    const scrollH = panelH - (opts.autoStart ? 148 : 108);
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(22, scrollTop, w - 44, scrollH);
    this._mask = maskShape.createGeometryMask();
    this._scrollTop = scrollTop;
    this._scrollBottom = scrollTop + scrollH - 8;
    this._scrollWidth = w - 52;
    this._scrollX = 26;

    this.scrollLayer = scene.add.container(0, 0).setMask(this._mask).setDepth(6);
    this._setLang(this.lang);

    const btnY = panelTop + panelH - 36;
    if (opts.autoStart) {
      this.startBtn = createPillButton(scene, w / 2, btnY, 220, 50, 'START!', () => {
        opts.onStart?.();
      });
      this.startBtn.setDepth(8);
    }
  }

  /**
   * @param {number} y
   */
  _buildLangToggle(y) {
    const mk = (label, lang, x, width = 40) => {
      const active = this.lang === lang;
      const bg = this.scene.add
        .rectangle(x, y, width, 26, active ? 0x1b7f4a : 0xffffff, active ? 1 : 0.75)
        .setStrokeStyle(2, 0x1b7f4a, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(6);
      const txt = this.scene.add
        .text(x, y, label, {
          fontFamily: styles.fonts.ui,
          fontSize: '11px',
          fontStyle: 'bold',
          color: active ? '#ffffff' : '#1B7F4A',
        })
        .setOrigin(0.5)
        .setDepth(6);
      bg.on('pointerdown', () => this._setLang(lang));
      this._langBtns = this._langBtns || [];
      this._langBtns.push({ bg, txt, lang });
      return bg;
    };
    mk('VN', 'vn', this.w / 2 - 52);
    mk('BOTH', 'both', this.w / 2, 44);
    mk('EN', 'en', this.w / 2 + 52);
  }

  /**
   * @param {'vn'|'en'|'both'} lang
   */
  _setLang(lang) {
    this.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    this.titleText.setText(TITLE[lang]);
    for (const b of this._langBtns || []) {
      const active = b.lang === lang;
      b.bg.setFillStyle(active ? 0x1b7f4a : 0xffffff, active ? 1 : 0.75);
      b.txt.setColor(active ? '#ffffff' : '#1B7F4A');
    }

    this._scrollContent?.destroy(true);
    const { container, height } = buildHowToPlayBody(
      this.scene,
      this._scrollX,
      0,
      this._scrollWidth,
      howToData,
      lang
    );
    this._scrollContent = container;
    this._contentHeight = height;
    this.scrollLayer.add(container);
    this._startScroll();
  }

  _startScroll() {
    if (this._scrollTween) this._scrollTween.stop();
    const viewH = this._scrollBottom - this._scrollTop;
    if (this._contentHeight <= viewH) {
      this._scrollContent.y = this._scrollTop;
      return;
    }
    const startY = this._scrollTop;
    const endY = this._scrollTop - (this._contentHeight - viewH);
    this._scrollContent.y = startY;
    const duration = Math.max(14000, ((this._contentHeight - viewH) / SCROLL_PX_PER_SEC) * 1000);
    this._scrollTween = this.scene.tweens.add({
      targets: this._scrollContent,
      y: endY,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this._scrollContent.y = startY;
        this._startScroll();
      },
    });
  }

  destroy() {
    if (this._scrollTween) this._scrollTween.stop();
    this.startBtn?.destroy(true);
    this.panelBg?.destroy();
    this.titleText?.destroy();
    this.scrollLayer?.destroy(true);
    for (const b of this._langBtns || []) {
      b.bg.destroy();
      b.txt.destroy();
    }
  }
}
