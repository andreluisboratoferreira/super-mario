/**
 * Web Audio API synthesizer for retro 8-bit platformer sound effects & chiptune BGM
 */
class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private sfxVolume: number = 0.35;
  private musicVolume: number = 0.15;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.bgmInterval) {
      this.stopMusic();
    }
  }

  public getIsMuted() {
    return this.isMuted;
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    if (muted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public getIsMusicMuted() {
    return this.isMusicMuted;
  }

  // --- SOUND EFFECTS ---

  public playJump(isLuigi: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isLuigi ? 'triangle' : 'square';

      const now = this.ctx.currentTime;
      const baseFreq = isLuigi ? 180 : 150;
      const endFreq = isLuigi ? 680 : 600;

      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);

      gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  public playSuperJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.22);

      gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.9, now);
      gain.gain.setValueAtTime(this.sfxVolume * 0.9, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {}
  }

  public playBump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

      gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  public playStomp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  public playSpring() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.1);
      osc.frequency.linearRampToValueAtTime(250, now + 0.2);
      osc.frequency.linearRampToValueAtTime(600, now + 0.3);

      gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  public playPowerUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [330, 392, 659, 523, 587, 784];
      notes.forEach((freq, i) => {
        const now = this.ctx!.currentTime + i * 0.07;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      });
    } catch {}
  }

  public playPortalOpen() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [440, 554, 659, 880, 1108];
      notes.forEach((freq, i) => {
        const now = this.ctx!.currentTime + i * 0.06;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch {}
  }

  public playTimerTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  public playMathSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const fanfare = [
        { f: 523.25, d: 0.1, t: 0 },
        { f: 659.25, d: 0.1, t: 0.1 },
        { f: 783.99, d: 0.12, t: 0.2 },
        { f: 1046.5, d: 0.35, t: 0.34 },
      ];

      fanfare.forEach((n) => {
        const now = this.ctx!.currentTime + n.t;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, now);

        gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + n.d);
      });
    } catch {}
  }

  public playMathFail() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [260, 220, 190];
      notes.forEach((freq, i) => {
        const now = this.ctx!.currentTime + i * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      });
    } catch {}
  }

  public playHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

      gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public playFireball() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

      gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playBossRoar() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.2);
      osc.frequency.linearRampToValueAtTime(65, now + 0.5);

      gain.gain.setValueAtTime(this.sfxVolume * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch {}
  }

  public playBridgeCollapse() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [120, 100, 80, 60, 45];
      notes.forEach((f, idx) => {
        const now = this.ctx!.currentTime + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      });
    } catch {}
  }

  public playBossVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Epic Victory Song!
      const fanfare = [
        { f: 523, t: 0, d: 0.15 },
        { f: 659, t: 0.15, d: 0.15 },
        { f: 784, t: 0.3, d: 0.15 },
        { f: 1046, t: 0.45, d: 0.3 },
        { f: 880, t: 0.8, d: 0.2 },
        { f: 1046, t: 1.05, d: 0.5 },
      ];

      fanfare.forEach((n) => {
        const now = this.ctx!.currentTime + n.t;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, now);

        gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + n.d);
      });
    } catch {}
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 523.25, t: 0, d: 0.18 },
        { f: 493.88, t: 0.2, d: 0.18 },
        { f: 466.16, t: 0.4, d: 0.18 },
        { f: 440.0, t: 0.6, d: 0.4 },
        { f: 349.23, t: 1.05, d: 0.5 },
      ];

      notes.forEach((n) => {
        const now = this.ctx!.currentTime + n.t;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now);

        gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + n.d);
      });
    } catch {}
  }

  // --- BACKGROUND MUSIC SYNTHESIZER ---

  public startMusic() {
    if (this.isMuted || this.isMusicMuted || this.bgmInterval) return;
    this.initCtx();
    if (!this.ctx) return;

    const melody = [
      330, 330, 0, 330, 0, 261, 330, 0,
      392, 0, 0, 0, 196, 0, 0, 0,
      261, 0, 0, 196, 0, 0, 164, 0,
      220, 0, 246, 0, 233, 220, 0, 196,
      330, 392, 440, 0, 349, 392, 0, 330,
      0, 261, 293, 246, 0, 0, 0, 0
    ];

    const bass = [
      130, 0, 130, 0, 130, 0, 130, 0,
      98, 0, 98, 0, 98, 0, 98, 0,
      130, 0, 130, 0, 130, 0, 130, 0,
      87, 0, 87, 0, 98, 0, 98, 0,
      130, 0, 130, 0, 110, 0, 110, 0,
      87, 0, 87, 0, 98, 0, 98, 0
    ];

    this.bgmStep = 0;
    const tempoMs = 140;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || this.isMusicMuted) return;

      const now = this.ctx.currentTime;
      const mNote = melody[this.bgmStep % melody.length];
      const bNote = bass[this.bgmStep % bass.length];

      if (mNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(mNote, now);
        gain.gain.setValueAtTime(this.musicVolume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }

      if (bNote > 0 && this.bgmStep % 2 === 0) {
        const oscB = this.ctx.createOscillator();
        const gainB = this.ctx.createGain();
        oscB.type = 'triangle';
        oscB.frequency.setValueAtTime(bNote, now);
        gainB.gain.setValueAtTime(this.musicVolume * 0.5, now);
        gainB.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        oscB.connect(gainB);
        gainB.connect(this.ctx.destination);
        oscB.start(now);
        oscB.stop(now + 0.18);
      }

      this.bgmStep++;
    }, tempoMs);
  }

  public stopMusic() {
    if (this.bgmInterval) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundService();
