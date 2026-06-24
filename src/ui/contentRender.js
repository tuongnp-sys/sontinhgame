import styles from '../data/content/contentStyles.json';

/**
 * @param {string} accent
 * @returns {string}
 */
export function paletteColor(accent) {
  if (!accent) return styles.palette.body;
  return styles.palette[accent] ?? styles.palette.body;
}

/**
 * Split plain text into segments with accent colors for known names.
 * @param {string} text
 * @param {'vn'|'en'} lang
 * @returns {{ text: string, color: string, fontStyle?: string }[]}
 */
export function highlightSegments(text, lang) {
  const defaultColor = lang === 'en' ? styles.palette.bodyEn : styles.palette.body;
  const terms = [...styles.highlights].sort(
    (a, b) => b[lang].length - a[lang].length
  );
  /** @type {{ text: string, color: string, fontStyle?: string }[]} */
  const segments = [];
  let rest = text;

  while (rest.length > 0) {
    let matched = null;
    let matchIndex = rest.length;

    for (const term of terms) {
      const needle = term[lang];
      const idx = rest.indexOf(needle);
      if (idx >= 0 && idx < matchIndex) {
        matchIndex = idx;
        matched = term;
      }
    }

    if (!matched) {
      segments.push({ text: rest, color: defaultColor });
      break;
    }

    if (matchIndex > 0) {
      segments.push({ text: rest.slice(0, matchIndex), color: defaultColor });
    }
    segments.push({
      text: matched[lang],
      color: paletteColor(matched.accent),
      fontStyle: 'bold',
    });
    rest = rest.slice(matchIndex + matched[lang].length);
  }

  return segments.filter((s) => s.text.length > 0);
}

/**
 * Layout wrapped multicolor paragraphs into a container.
 * @param {Phaser.Scene} scene
 * @param {number} x left edge
 * @param {number} y start y
 * @param {number} maxWidth
 * @param {string} text
 * @param {'vn'|'en'} lang
 * @param {{ fontSize?: string, lineSpacing?: number }} [opts]
 * @returns {{ container: Phaser.GameObjects.Container, height: number }}
 */
export function buildHighlightedParagraph(scene, x, y, maxWidth, text, lang, opts = {}) {
  const fontSize = opts.fontSize ?? styles.sizes.body;
  const lineSpacing = opts.lineSpacing ?? 6;
  const fontFamily = styles.fonts.body;
  const container = scene.add.container(0, 0);

  const paragraphs = text.split('\n');
  let cy = y;

  for (const para of paragraphs) {
    if (!para.trim()) {
      cy += parseInt(fontSize, 10) * 0.5;
      continue;
    }

    const segments = highlightSegments(para, lang);
    let cx = x;
    let lineH = 0;

    const flushLine = () => {
      cy += lineH + lineSpacing;
      cx = x;
      lineH = 0;
    };

    for (const seg of segments) {
      const words = seg.text.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        const probe = scene.add.text(0, 0, word, {
          fontFamily,
          fontSize,
          fontStyle: seg.fontStyle ?? 'normal',
          color: seg.color,
        });
        const w = probe.width;
        probe.destroy();

        if (cx + w > x + maxWidth && cx > x) {
          flushLine();
        }

        const t = scene.add.text(cx, cy, word, {
          fontFamily,
          fontSize,
          fontStyle: seg.fontStyle ?? 'normal',
          color: seg.color,
        });
        container.add(t);
        cx += w;
        lineH = Math.max(lineH, t.height);
      }
    }
    if (lineH > 0) flushLine();
  }

  return { container, height: cy - y };
}

/**
 * Build legend/poem scroll body as stacked blocks.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} maxWidth
 * @param {import('../data/content/legend.json')} legendData
 * @param {'vn'|'en'} lang
 * @returns {{ container: Phaser.GameObjects.Container, height: number }}
 */
export function buildLegendBody(scene, x, y, maxWidth, legendData, lang) {
  const container = scene.add.container(0, 0);
  let cy = y;

  const intro = scene.add.text(x, cy, legendData.intro[lang], {
    fontFamily: styles.fonts.body,
    fontSize: styles.sizes.body,
    fontStyle: 'italic',
    color: styles.palette.bodyEn,
    wordWrap: { width: maxWidth },
    lineSpacing: 6,
  });
  container.add(intro);
  cy += intro.height + 14;

  for (const section of legendData.sections) {
    const heading = scene.add.text(x, cy, section.heading[lang], {
      fontFamily: styles.fonts.title,
      fontSize: styles.sizes.sectionHeading,
      fontStyle: 'bold',
      color: styles.palette.sectionHeading,
      wordWrap: { width: maxWidth },
    });
    container.add(heading);
    cy += heading.height + 8;

    const { container: bodyBlock, height: bodyH } = buildHighlightedParagraph(
      scene,
      x,
      cy,
      maxWidth,
      section.body[lang],
      lang
    );
    container.add(bodyBlock);
    cy += bodyH + 6;

    if (section.vocab?.length) {
      const vocabLines = section.vocab.map((v) => `📖 ${v.vn} → ${v.en}`).join('\n');
      const vocab = scene.add.text(x, cy, vocabLines, {
        fontFamily: styles.fonts.ui,
        fontSize: styles.sizes.vocab,
        fontStyle: 'italic',
        color: styles.palette.vocab,
        wordWrap: { width: maxWidth },
        lineSpacing: 4,
      });
      container.add(vocab);
      cy += vocab.height + 16;
    } else {
      cy += 10;
    }
  }

  return { container, height: cy - y };
}

/**
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} maxWidth
 * @param {import('../data/content/poem-ngochoa.json')} poemData
 * @param {'vn'|'en'|'both'} mode
 * @returns {{ container: Phaser.GameObjects.Container, height: number }}
 */
export function buildPoemBody(scene, x, y, maxWidth, poemData, mode) {
  const container = scene.add.container(0, 0);
  let cy = y;
  const lineGap = 4;
  const stanzaGap = 12;

  for (const stanza of poemData.stanzas) {
    for (const line of stanza.lines) {
      if (mode === 'both' || mode === 'vn') {
        const color =
          line.accent && mode === 'vn'
            ? paletteColor(line.accent)
            : styles.palette.poemLineVn;
        const vn = scene.add.text(x + maxWidth / 2, cy, line.vn, {
          fontFamily: styles.fonts.body,
          fontSize: styles.sizes.poemLine,
          fontStyle: line.accent ? 'bold italic' : 'normal',
          color,
          align: 'center',
          wordWrap: { width: maxWidth },
        }).setOrigin(0.5, 0);
        container.add(vn);
        cy += vn.height + lineGap;
      }

      if (mode === 'both' || mode === 'en') {
        const color =
          line.accent && mode === 'en'
            ? paletteColor(line.accent)
            : mode === 'both'
              ? styles.palette.poemLineEn
              : styles.palette.poemLineEn;
        const en = scene.add.text(x + maxWidth / 2, cy, line.en, {
          fontFamily: styles.fonts.body,
          fontSize: styles.sizes.poemLine,
          fontStyle: mode === 'both' ? 'italic' : line.accent ? 'bold italic' : 'italic',
          color,
          align: 'center',
          wordWrap: { width: maxWidth },
        }).setOrigin(0.5, 0);
        container.add(en);
        cy += en.height + lineGap;
      }
    }
    cy += stanzaGap;
  }

  return { container, height: cy - y };
}
