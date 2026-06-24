/**
 * Bộ quản lý âm thanh — tối ưu CPU: buffer pool, ít oscillator, không setTimeout lồng nhau.
 */
export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.unlocked = false;
    this.muted = false;
    this.dangerLevel = 0;
    this.masterGain = null;
    /** @type {GainNode[]} */
    this.layerGains = [];
    /** @type {OscillatorNode[]} */
    this.layerOscs = [];
    /** @type {AudioBuffer|null} */
    this._drumBuffer = null;
    /** @type {Record<string, AudioBuffer>} */
    this._sfxBuffers = {};
    this._beatTimer = null;
    this._lastDangerRatio = -1;
    this.proceduralMusicEnabled = true;
  }

  /**
   * @param {{ proceduralMusic?: boolean }} [opts]
   */
  async unlock(opts = {}) {
    const wantMusic = opts.proceduralMusic !== false;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
      this._createBuffers();
      this._initLayers();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.unlocked = true;
    this.setProceduralMusicEnabled(wantMusic);
    return true;
  }

  /** @param {boolean} enabled */
  setProceduralMusicEnabled(enabled) {
    this.proceduralMusicEnabled = enabled;
    if (!this.ctx) return;

    if (enabled) {
      if (!this._beatTimer) this._startBeat();
      if (this.layerGains[0]) {
        const t = this.ctx.currentTime;
        this.layerGains[0].gain.cancelScheduledValues(t);
        this.layerGains[0].gain.setValueAtTime(this.muted ? 0 : 0.6, t);
      }
    } else {
      this._stopBeat();
      const t = this.ctx.currentTime;
      for (let i = 0; i < this.layerGains.length; i++) {
        this.layerGains[i].gain.cancelScheduledValues(t);
        this.layerGains[i].gain.setValueAtTime(0, t);
      }
      this.dangerLevel = 0;
      this._lastDangerRatio = -1;
    }
  }

  _stopBeat() {
    if (this._beatTimer) clearInterval(this._beatTimer);
    this._beatTimer = null;
  }

  _createBuffers() {
    const sr = this.ctx.sampleRate;
    this._drumBuffer = this._makeToneBuffer(sr, 0.12, 90, 0.35);

    const sfxDefs = {
      perfect: { dur: 0.08, freq: 520, vol: 0.2 },
      great: { dur: 0.08, freq: 400, vol: 0.18 },
      good: { dur: 0.07, freq: 320, vol: 0.15 },
      miss: { dur: 0.1, freq: 150, vol: 0.2 },
      poison: { dur: 0.12, freq: 90, vol: 0.22 },
    };
    for (const [key, def] of Object.entries(sfxDefs)) {
      this._sfxBuffers[key] = this._makeToneBuffer(sr, def.dur, def.freq, def.vol, key === 'poison');
    }
  }

  /**
   * @param {number} sampleRate
   * @param {number} duration
   * @param {number} freq
   * @param {number} vol
   * @param {boolean} square
   */
  _makeToneBuffer(sampleRate, duration, freq, vol, square = false) {
    const len = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const wave = square
        ? Math.sign(Math.sin(2 * Math.PI * freq * t))
        : Math.sin(2 * Math.PI * freq * t);
      data[i] = wave * vol * Math.exp(-t * 18);
    }
    return buffer;
  }

  _initLayers() {
    for (let i = 0; i < 3; i++) {
      const gain = this.ctx.createGain();
      gain.gain.value = i === 0 ? 0.6 : 0;
      gain.connect(this.masterGain);
      this.layerGains.push(gain);
    }
    this._ensureLayerOsc(0, 100);
  }

  /**
   * @param {number} layer
   * @param {number} freq
   */
  _ensureLayerOsc(layer, freq) {
    if (this.layerOscs[layer]) return;
    const osc = this.ctx.createOscillator();
    osc.type = layer === 2 ? 'sawtooth' : 'triangle';
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = layer === 2 ? 0.04 : 0.06;
    osc.connect(g);
    g.connect(this.layerGains[layer]);
    osc.start();
    this.layerOscs[layer] = osc;
  }

  _startBeat() {
    this._stopBeat();
    this._beatTimer = setInterval(() => {
      if (this.ctx && this.unlocked && !this.muted && this.proceduralMusicEnabled) {
        this._playBuffer(this._drumBuffer, 0.5);
      }
    }, 500);
  }

  /**
   * @param {AudioBuffer|null} buffer
   * @param {number} gain
   */
  _playBuffer(buffer, gain = 1) {
    if (!this.ctx || !buffer || this.muted) return;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.buffer = buffer;
    src.connect(g);
    g.connect(this.masterGain);
    src.start();
  }

  setDangerRatio(ratio) {
    if (!this.ctx || !this.proceduralMusicEnabled) return;
    if (Math.abs(ratio - this._lastDangerRatio) < 0.02) return;
    this._lastDangerRatio = ratio;

    let level = 0;
    if (ratio >= 0.75) level = 2;
    else if (ratio >= 0.4) level = 1;
    if (level === this.dangerLevel) return;
    this.dangerLevel = level;

    if (level >= 1) this._ensureLayerOsc(1, 220);
    if (level >= 2) this._ensureLayerOsc(2, 65);

    const t = this.ctx.currentTime;
    const targets = [
      [0.6, 0.0, 0.0],
      [0.5, 0.35, 0.0],
      [0.3, 0.35, 0.25],
    ][level];

    for (let i = 0; i < 3; i++) {
      this.layerGains[i].gain.cancelScheduledValues(t);
      this.layerGains[i].gain.setValueAtTime(this.layerGains[i].gain.value, t);
      this.layerGains[i].gain.linearRampToValueAtTime(
        this.muted ? 0 : targets[i],
        t + 0.8
      );
    }
  }

  /**
   * @param {string} type
   */
  playSfx(type) {
    const buf = this._sfxBuffers[type];
    if (buf) this._playBuffer(buf, 1);
  }

  pause() {
    if (this.ctx?.state === 'running') this.ctx.suspend();
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : 0.35;
  }

  stop() {
    this._stopBeat();
    for (const osc of this.layerOscs) {
      if (osc) {
        try {
          osc.stop();
        } catch (_) {}
      }
    }
    this.layerOscs = [];
    this.layerGains = [];
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.unlocked = false;
    this.dangerLevel = 0;
    this._lastDangerRatio = -1;
    this.proceduralMusicEnabled = true;
  }
}

export const audioManager = new AudioManager();
