// Krótkie efekty dźwiękowe syntezowane w WebAudio (bez plików).

let ac = null;
let enabled = true;

export function setSound(on) { enabled = on; }

export function unlockAudio() {
  if (ac || !enabled) return;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
  } catch { ac = null; }
}

function tone(freq, dur, { type = 'sine', vol = 0.15, slide = 0, delay = 0 } = {}) {
  if (!enabled || !ac) return;
  if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, vol = 0.08, freq = 900) {
  if (!enabled || !ac) return;
  const t = ac.currentTime;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
}

export const sfx = {
  click: () => tone(660, 0.06, { type: 'triangle', vol: 0.08 }),
  pop: () => tone(520, 0.12, { type: 'sine', vol: 0.16, slide: 380 }),
  plant: () => tone(380, 0.1, { type: 'triangle', vol: 0.1, slide: 120 }),
  plow: () => noise(0.16, 0.12, 700),
  coin: () => { tone(988, 0.08, { type: 'square', vol: 0.05 }); tone(1319, 0.16, { type: 'square', vol: 0.05, delay: 0.07 }); },
  error: () => tone(180, 0.18, { type: 'sawtooth', vol: 0.06, slide: -60 }),
  build: () => { noise(0.08, 0.1, 1500); tone(300, 0.08, { type: 'square', vol: 0.05, delay: 0.1 }); noise(0.08, 0.1, 1500); },
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.12, delay: i * 0.11 })),
  moo: () => tone(150, 0.5, { type: 'sawtooth', vol: 0.05, slide: -40 }),
  cluck: () => { tone(900, 0.05, { type: 'square', vol: 0.04 }); tone(1100, 0.05, { type: 'square', vol: 0.04, delay: 0.08 }); }
};
