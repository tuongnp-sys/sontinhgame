import palettes from '../data/palettes.json';

const UI = palettes.ui;

/**
 * Chuyển hex #RRGGBB sang số 0xRRGGBB
 * @param {string} hex
 */
export function hexToNum(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Nút pill kiểu MangoRus — gradient + bóng đổ.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {string} label
 * @param {() => void} onClick
 * @param {boolean} secondary
 */
export function createPillButton(scene, x, y, width, height, label, onClick, secondary = false) {
  const container = scene.add.container(x, y);

  const shadow = scene.add.rectangle(0, 4, width, height, hexToNum(secondary ? '#636E72' : UI.btnShadow));
  shadow.setStrokeStyle(0);

  const topColor = secondary ? 0xdfe6e9 : hexToNum(UI.btnTop);
  const botColor = secondary ? 0xb2bec3 : hexToNum(UI.btnBottom);
  const face = scene.add.graphics();
  face.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
  face.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
      fontSize: secondary ? '15px' : '18px',
      fontStyle: 'bold',
      color: '#2D3436',
    })
    .setOrigin(0.5);

  const hit = scene.add
    .rectangle(0, 0, width, height, 0xffffff, 0.001)
    .setInteractive({ useHandCursor: true });

  hit.on('pointerdown', () => {
    container.y = y + 2;
    shadow.y = 6;
  });
  hit.on('pointerup', () => {
    container.y = y;
    shadow.y = 4;
    onClick();
  });
  hit.on('pointerout', () => {
    container.y = y;
    shadow.y = 4;
  });

  container.add([shadow, face, text, hit]);

  scene.tweens.add({
    targets: container,
    scaleX: 1.04,
    scaleY: 1.04,
    duration: 550,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  return container;
}

/**
 * Thanh nhãn câu hỏi (không bấm) — ví dụ "CHẤP NHẬN".
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {string} label
 */
export function createChoiceLabelBar(scene, x, y, width, label) {
  const container = scene.add.container(x, y);

  const bg = scene.add
    .rectangle(0, 0, width, 38, 0x1a5276, 0.55)
    .setStrokeStyle(2, 0x3498db, 0.95);
  const accent = scene.add.rectangle(0, -14, width - 24, 3, 0x5dade2, 0.85);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#D6EAF8',
    })
    .setOrigin(0.5);

  container.add([bg, accent, text]);
  return container;
}

/**
 * Nút nhỏ màu xanh — YES / NO.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} label
 * @param {() => void} onClick
 */
export function createSmallBlueButton(scene, x, y, label, onClick) {
  const width = 76;
  const height = 36;
  const container = scene.add.container(x, y);

  const shadow = scene.add.rectangle(0, 3, width, height, 0x154360, 0.9);
  const face = scene.add.graphics();
  face.fillGradientStyle(0x5dade2, 0x5dade2, 0x2980b9, 0x2980b9, 1);
  face.fillRoundedRect(-width / 2, -height / 2, width, height, 10);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    })
    .setOrigin(0.5);

  const hit = scene.add
    .rectangle(0, 0, width, height, 0xffffff, 0.001)
    .setInteractive({ useHandCursor: true });

  hit.on('pointerdown', () => {
    container.y = y + 2;
    shadow.y = 5;
  });
  hit.on('pointerup', () => {
    container.y = y;
    shadow.y = 3;
    onClick();
  });
  hit.on('pointerout', () => {
    container.y = y;
    shadow.y = 3;
  });

  container.add([shadow, face, text, hit]);
  return container;
}

/**
 * Tiêu đề arcade — vàng + shadow đỏ.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} title
 * @param {string} [subtitle]
 */
export function createArcadeTitle(scene, x, y, title, subtitle) {
  const shadow = scene.add
    .text(x + 3, y + 3, title, {
      fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: UI.titleShadow,
    })
    .setOrigin(0.5);

  const main = scene.add
    .text(x, y, title, {
      fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: UI.title,
    })
    .setOrigin(0.5);

  const parts = [shadow, main];

  if (subtitle) {
    const sub = scene.add
      .text(x, y + 36, subtitle, {
        fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
        fontSize: '15px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5);
    parts.push(sub);
  }

  return parts;
}
