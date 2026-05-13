/**
 * Audio System
 * Web Audio API for procedural SFX and ambient tones.
 * No external audio files needed - all generated.
 */

class AudioSystem {
  constructor() {
    this.audioCtx = null;
    this.masterVolume = 1.0;
    this.ambientNodes = [];
    this.isAmbientPlaying = false;
  }

  _getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioCtx;
  }

  /**
   * Play a generated tone.
   */
  playTone(frequency = 440, duration = 0.3, type = 'sine', volume = 0.3) {
    try {
      const ctx = this._getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume * this.masterVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context may not be available
    }
  }

  /**
   * Start the ambient low house hum.
   */
  playAmbient() {
    if (this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;

    try {
      const ctx = this._getAudioContext();

      // Low rumble
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(38, ctx.currentTime);
      gain1.gain.setValueAtTime(0.06, ctx.currentTime);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      this.ambientNodes.push(osc1, gain1);

      // Subtle detuned second tone for unease
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(40.5, ctx.currentTime);
      gain2.gain.setValueAtTime(0.03, ctx.currentTime);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      this.ambientNodes.push(osc2, gain2);

      // High-frequency barely-audible whine for tension
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(3200, ctx.currentTime);
      gain3.gain.setValueAtTime(0.008, ctx.currentTime);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start();
      this.ambientNodes.push(osc3, gain3);
    } catch (e) {
      // Audio context may not be available
    }
  }

  stopAmbient() {
    this.ambientNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.ambientNodes = [];
    this.isAmbientPlaying = false;
  }

  // -- Specific SFX --

  playDoorCreak() {
    this.playTone(80, 1.5, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(60, 0.8, 'sawtooth', 0.1), 200);
  }

  playKeyPickup() {
    this.playTone(880, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.15), 100);
    setTimeout(() => this.playTone(1320, 0.2, 'sine', 0.1), 200);
  }

  playLetterFound() {
    this.playTone(330, 0.4, 'sine', 0.15);
    setTimeout(() => this.playTone(350, 0.6, 'triangle', 0.1), 200);
  }

  playMonsterVoice() {
    this.playTone(55, 2.0, 'sawtooth', 0.25);
    this.playTone(58, 2.0, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(40, 1.5, 'square', 0.15), 500);
  }

  playQTETick() {
    this.playTone(600, 0.08, 'square', 0.2);
  }

  playQTESuccess() {
    this.playTone(520, 0.1, 'sine', 0.25);
  }

  playQTEFail() {
    this.playTone(100, 0.5, 'sawtooth', 0.4);
    this.playTone(103, 0.5, 'sawtooth', 0.35);
    this.playTone(50, 0.8, 'square', 0.3);
  }

  playHeartbeat() {
    this.playTone(60, 0.15, 'sine', 0.3);
    setTimeout(() => this.playTone(50, 0.15, 'sine', 0.25), 180);
  }

  playEscapeSound() {
    this.playTone(440, 0.3, 'sine', 0.15);
    setTimeout(() => this.playTone(660, 0.4, 'sine', 0.1), 200);
  }

  dispose() {
    this.stopAmbient();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

const audioSystem = new AudioSystem();
export { audioSystem };
