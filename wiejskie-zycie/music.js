// Procedural background music: a gentle folk tune on a pentatonic scale
// with a soft drone, scheduled with the Web Audio clock.

const PHRASES = [
  [0, null, 2, 4, 4, null, 2, 0, 2, null, 4, 7, 4, null, null, null],
  [7, null, 9, 7, 4, null, 2, 4, 2, null, 0, 2, 0, null, null, null],
  [4, 4, 7, null, 9, 7, 4, null, 2, 4, 2, 0, 2, null, null, null],
  [12, null, 9, 7, 9, null, 7, 4, 2, null, 4, 2, 0, null, null, null]
];
const BASS = [0, 5, 0, 7];
const ROOT = 196;
const STEP = 60 / 96 / 2;

const freq = semi => ROOT * 2 ** (semi / 12);

export function createMusic(getAudio) {
  let timer = null;
  let out = null;
  let step = 0;
  let next = 0;

  function note(ctx, f, t, dur, type, vol) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function schedule(ctx) {
    while (next < ctx.currentTime + 0.4) {
      const phrase = Math.floor(step / 16) % PHRASES.length;
      const pos = step % 16;
      const semi = PHRASES[phrase][pos];
      if (semi !== null) note(ctx, freq(semi + 12), next, STEP * 1.8, 'triangle', 0.5);
      if (pos === 0 || pos === 8) note(ctx, freq(BASS[phrase] - 12 + (pos === 8 ? 7 : 0)), next, STEP * 7, 'sine', 0.45);
      next += STEP;
      step++;
    }
  }

  return {
    start() {
      const ctx = getAudio();
      if (!ctx || timer) return;
      out = ctx.createGain();
      out.gain.value = 0.045;
      out.connect(ctx.destination);
      next = ctx.currentTime + 0.15;
      timer = setInterval(() => schedule(ctx), 150);
    },
    stop() {
      clearInterval(timer);
      timer = null;
      if (out) {
        out.disconnect();
        out = null;
      }
    },
    get playing() {
      return !!timer;
    }
  };
}
