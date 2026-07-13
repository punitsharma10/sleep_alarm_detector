/**
 * Web Audio based alarm generator. Uses oscillators so the app ships without
 * binary audio assets and can offer distinct alarm timbres. The alarm loops
 * until stopped and respects a live volume control.
 */

export type AlarmSound = 'classic' | 'siren' | 'beep' | 'chime';

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
}

export class AlarmEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: Voice[] = [];
  private lfoTimer: number | null = null;
  private playing = false;
  private volume = 0.8;
  private sound: AlarmSound = 'classic';

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  setSound(sound: AlarmSound): void {
    this.sound = sound;
    if (this.playing) {
      this.stop();
      this.start();
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  start(): void {
    if (this.playing) return;
    const ctx = this.ensureContext();
    void ctx.resume();
    this.playing = true;

    const makeVoice = (freq: number, type: OscillatorType): Voice => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.4;
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start();
      return { osc, gain };
    };

    switch (this.sound) {
      case 'siren': {
        const v = makeVoice(600, 'sawtooth');
        this.voices.push(v);
        let up = true;
        this.lfoTimer = window.setInterval(() => {
          up = !up;
          v.osc.frequency.linearRampToValueAtTime(up ? 900 : 500, ctx.currentTime + 0.3);
        }, 300);
        break;
      }
      case 'beep': {
        const v = makeVoice(1000, 'square');
        v.gain.gain.value = 0;
        this.voices.push(v);
        let on = false;
        this.lfoTimer = window.setInterval(() => {
          on = !on;
          v.gain.gain.setValueAtTime(on ? 0.4 : 0, ctx.currentTime);
        }, 250);
        break;
      }
      case 'chime': {
        this.voices.push(makeVoice(880, 'sine'));
        this.voices.push(makeVoice(1320, 'sine'));
        break;
      }
      case 'classic':
      default: {
        const v = makeVoice(760, 'triangle');
        this.voices.push(v);
        let on = true;
        this.lfoTimer = window.setInterval(() => {
          on = !on;
          v.osc.frequency.setValueAtTime(on ? 760 : 1020, ctx.currentTime);
        }, 400);
        break;
      }
    }
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.lfoTimer !== null) {
      clearInterval(this.lfoTimer);
      this.lfoTimer = null;
    }
    for (const v of this.voices) {
      try {
        v.osc.stop();
        v.osc.disconnect();
        v.gain.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.voices = [];
  }

  dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
    }
  }
}
