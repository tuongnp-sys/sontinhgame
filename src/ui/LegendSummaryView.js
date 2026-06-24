import Phaser from 'phaser';
import legendData from '../data/content/legend.json';
import styles from '../data/content/contentStyles.json';
import { buildLegendBody } from './contentRender.js';
import { createPillButton } from './phaserUi.js';

const SCROLL_PX_PER_SEC = 18;
const LANG_KEY = 'sontinh_legend_lang';

const SHORT_TITLE = {
  vn: 'Tóm tắt truyện',
  en: 'Legend Summary',
};

/**
 * Full-screen bilingual legend reader — rich colors + vocabulary for English learning.
 */
export class LegendSummaryView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} w
   * @param {number} h
   * @param {() => void} onClose
   */
  constructor(scene, w, h, onClose) {
    this.scene = scene;
    this.w = w;
    this.h = h;
    this.onClose = onClose;
    this.lang = localStorage.getItem(LANG_KEY) || 'vn';
    this._scrollTween = null;
    this._scrollContent = null;

    this.root = scene.add.container(0, 0).setDepth(90);

    const backdrop = scene.add
      .rectangle(w / 2, h / 2, w, h, 0x0a1628, 0.72)
      .setInteractive();
    this.root.add(backdrop);

    const panelH = h - 48;
    const panel = scene.add
      .rectangle(w / 2, h / 2, w - 20, panelH, 0xfff8e7, 0.98)
      .setStrokeStyle(3, 0xf1c40f, 1);
    this.root.add(panel);

    const panelTop = h / 2 - panelH / 2;

    this.titleText = scene.add
      .text(w / 2, panelTop + 14, SHORT_TITLE[this.lang], {
        fontFamily: styles.fonts.title,
        fontSize: '17px',
        fontStyle: 'bold',
        color: styles.palette.title,
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.root.add(this.titleText);

    const langY = panelTop + 44;
    this._buildLangToggle(langY);

    this.hintText = scene.add
      .text(w / 2, langY + 24, 'Colored names · 📖 vocabulary below each section', {
        fontFamily: styles.fonts.ui,
        fontSize: '10px',
        fontStyle: 'italic',
        color: '#636E72',
        align: 'center',
        wordWrap: { width: w - 56 },
      })
      .setOrigin(0.5, 0);
    this.root.add(this.hintText);

    const scrollTop = panelTop + 88;
    const scrollH = panelH - 140;
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(22, scrollTop, w - 44, scrollH);
    this._mask = maskShape.createGeometryMask();
    this._scrollTop = scrollTop;
    this._scrollBottom = scrollTop + scrollH - 8;
    this._scrollWidth = w - 52;
    this._scrollX = 26;

    this.scrollLayer = scene.add.container(0, 0).setMask(this._mask);
    this.root.add(this.scrollLayer);

    this._setLang(this.lang);

    this.closeBtn = createPillButton(scene, w / 2, panelTop + panelH - 36, 200, 44, 'CLOSE', () => {
      this.destroy();
      onClose();
    });
    this.closeBtn.setDepth(91);
  }

  /**
   * @param {number} y
   */
  _buildLangToggle(y) {
    const makeBtn = (x, label, lang) => {
      const bg = this.scene.add
        .rectangle(x, y, 52, 28, this.lang === lang ? 0x1b7f4a : 0x636e72, 0.9)
        .setStrokeStyle(2, 0xfdcb6e, 0.85)
        .setInteractive({ useHandCursor: true });
      const txt = this.scene.add
        .text(x, y, label, {
          fontFamily: styles.fonts.ui,
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#FFEAA7',
        })
        .setOrigin(0.5);
      bg.on('pointerdown', () => this._setLang(lang));
      this.root.add([bg, txt]);
      return bg;
    };
    this.vnBtn = makeBtn(this.w / 2 - 32, 'VN', 'vn');
    this.enBtn = makeBtn(this.w / 2 + 32, 'EN', 'en');
  }

  /**
   * @param {'vn'|'en'} lang
   */
  _setLang(lang) {
    this.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    this.titleText.setText(SHORT_TITLE[lang]);
    this.vnBtn?.setFillStyle(lang === 'vn' ? 0x1b7f4a : 0x636e72, 0.9);
    this.enBtn?.setFillStyle(lang === 'en' ? 0x1b7f4a : 0x636e72, 0.9);

    this._scrollContent?.destroy(true);
    const { container, height } = buildLegendBody(
      this.scene,
      this._scrollX,
      0,
      this._scrollWidth,
      legendData,
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

    const duration = Math.max(12000, ((this._contentHeight - viewH) / SCROLL_PX_PER_SEC) * 1000);
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
    this.closeBtn?.destroy(true);
    this.root?.destroy(true);
  }
}
