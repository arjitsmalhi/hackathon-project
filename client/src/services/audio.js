// Web Audio API synthesizer for Pomodoro notification chimes

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundEffects = {
  // Gentle high-pitched chime when a focus session completes
  playFocusComplete() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + index * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.65);
      });
    } catch (e) {
      console.warn('Audio playback not supported or user has not interacted with DOM yet', e);
    }
  },

  // Two-tone bell for focus start
  playFocusStart() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [440, 880].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.15);

        gain.gain.setValueAtTime(0, now + index * 0.15);
        gain.gain.linearRampToValueAtTime(0.15, now + index * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 0.55);
      });
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  },

  // Soft tone for break start
  playBreakStart() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [659.25, 523.25].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.18);

        gain.gain.setValueAtTime(0, now + index * 0.18);
        gain.gain.linearRampToValueAtTime(0.15, now + index * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.18 + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.18);
        osc.stop(now + index * 0.18 + 0.75);
      });
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }
};
