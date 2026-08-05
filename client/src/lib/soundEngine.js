// Fully synthesized sound engine — no audio files. Everything here is generated
// with the Web Audio API at call time, so there are zero binary assets to ship
// and no licensing/attribution to track. Sounds are deliberately short and quiet;
// this is ambience, not a soundtrack.

let ctx = null;
let humNodes = null; // { source, gain, filter } while the projector hum is playing
let muted = true; // start muted — browsers block autoplay, and the user should opt in

const MASTER_VOLUME = 0.35;

const getCtx = () => {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  return ctx;
};

// Unlocks/resumes the AudioContext — must be called from a real user gesture
// (browsers suspend contexts created/used outside one).
export const unlockAudio = () => {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume();
};

export const setMuted = (value) => {
  muted = value;
  if (muted) stopHum();
};

export const isMuted = () => muted;

const envelopeGain = (c, destination, { attack = 0.005, decay = 0.15, peak = 1 } = {}) => {
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(peak, c.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + attack + decay);
  gain.connect(destination);
  return gain;
};

// Soft UI click — short filtered noise burst, like a gentle mechanical tick.
export const playClick = () => {
  if (muted) return;
  const c = getCtx();
  if (!c) return;

  const bufferSize = c.sampleRate * 0.03;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const noise = c.createBufferSource();
  noise.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2200;

  const gain = envelopeGain(c, c.destination, { attack: 0.002, decay: 0.05, peak: MASTER_VOLUME * 0.5 });
  noise.connect(filter);
  filter.connect(gain);
  noise.start();
  noise.stop(c.currentTime + 0.06);
};

// Seat selection — a soft, slightly resonant "thunk" (two detuned sine blips).
export const playSeatSelect = (selected = true) => {
  if (muted) return;
  const c = getCtx();
  if (!c) return;

  const baseFreq = selected ? 420 : 300;
  [0, 5].forEach((detune, i) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = baseFreq + detune;
    const gain = envelopeGain(c, c.destination, { attack: 0.004, decay: 0.12, peak: MASTER_VOLUME * (i === 0 ? 0.4 : 0.2) });
    osc.connect(gain);
    osc.start();
    osc.stop(c.currentTime + 0.15);
  });
};

// Ticket/booking confirmation — a bright ascending three-note chime.
export const playConfirm = () => {
  if (muted) return;
  const c = getCtx();
  if (!c) return;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — simple, pleasant major triad
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const startAt = c.currentTime + i * 0.09;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(MASTER_VOLUME * 0.45, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.5);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.55);
  });
};

// Continuous soft projector hum — filtered brown-noise loop, very quiet, meant
// to sit under everything else. Call stopHum() to fade it out.
export const startHum = () => {
  if (muted || humNodes) return;
  const c = getCtx();
  if (!c) return;

  const bufferSize = c.sampleRate * 2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // brown noise integration — low, rumbly, not harsh
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 6;
  }

  const source = c.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 180;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(MASTER_VOLUME * 0.06, c.currentTime + 1.2);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  source.start();

  humNodes = { source, gain, filter };
};

export const stopHum = () => {
  if (!humNodes || !ctx) return;
  const { source, gain } = humNodes;
  const c = ctx;
  gain.gain.cancelScheduledValues(c.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, c.currentTime);
  gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
  source.stop(c.currentTime + 0.65);
  humNodes = null;
};
