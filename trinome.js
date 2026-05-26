'use strict';

// ── Audio synthesis ──────────────────────────────────────────────────────────

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playBell(time) {
  const ctx = getCtx();
  [[880, 0.30], [1320, 0.18], [2200, 0.08]].forEach(([freq, amp]) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(amp, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.6);
  });
}

function playTick(time) {
  const ctx  = getCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, time);
  osc.frequency.exponentialRampToValueAtTime(600, time + 0.03);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.35, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.05);
}

function playTock(time) {
  const ctx  = getCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, time);
  osc.frequency.exponentialRampToValueAtTime(280, time + 0.05);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.40, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.07);
}

// ── Acoustic synthesis helpers ───────────────────────────────────────────────

function noiseBurst(time, centerFreq, Q, peakGain, attackSec, decaySec) {
  const ctx = getCtx();
  const dur = attackSec + decaySec;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = centerFreq; bpf.Q.value = Q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(peakGain, time + attackSec);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
  src.start(time); src.stop(time + dur + 0.01);
}

function sinePartials(time, partials) {
  const ctx = getCtx();
  partials.forEach(({ freq, amp, decay }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(amp, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(time); osc.stop(time + decay + 0.05);
  });
}

// ── Kit: classic ─────────────────────────────────────────────────────────────

function synthBell(time) {
  sinePartials(time, [
    { freq: 440,  amp: 0.18, decay: 1.20 },
    { freq: 1212, amp: 0.11, decay: 0.90 },
    { freq: 2378, amp: 0.07, decay: 0.60 },
    { freq: 3930, amp: 0.03, decay: 0.35 },
  ]);
}
function synthWoodHi(time) { noiseBurst(time, 1500, 8, 0.50, 0.001, 0.040); }
function synthWoodLo(time) { noiseBurst(time,  650, 6, 0.45, 0.001, 0.055); }

// ── Kit: kalimba ─────────────────────────────────────────────────────────────

function synthKalimbaHi(time) {
  sinePartials(time, [
    { freq: 440,  amp: 0.20, decay: 0.70 },
    { freq: 880,  amp: 0.10, decay: 0.45 },
    { freq: 1320, amp: 0.04, decay: 0.25 },
  ]);
}
function synthKalimbaMid(time) {
  sinePartials(time, [
    { freq: 330,  amp: 0.18, decay: 0.70 },
    { freq: 660,  amp: 0.09, decay: 0.45 },
    { freq: 990,  amp: 0.03, decay: 0.25 },
  ]);
}
function synthKalimbaLo(time) {
  sinePartials(time, [
    { freq: 220,  amp: 0.22, decay: 1.00 },
    { freq: 440,  amp: 0.10, decay: 0.65 },
    { freq: 660,  amp: 0.04, decay: 0.35 },
  ]);
}

// ── Kit: tabla ───────────────────────────────────────────────────────────────

function synthTablaHi(time) {
  const ctx = getCtx();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(380, time);
  osc.frequency.exponentialRampToValueAtTime(180, time + 0.06);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.38, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(time); osc.stop(time + 0.15);
  noiseBurst(time, 2200, 5, 0.15, 0.001, 0.012);
}
function synthTablaMid(time) {
  const ctx = getCtx();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, time);
  osc.frequency.exponentialRampToValueAtTime(120, time + 0.08);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.36, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(time); osc.stop(time + 0.18);
  noiseBurst(time, 1400, 4, 0.12, 0.001, 0.015);
}
function synthTablaLo(time) {
  const ctx = getCtx();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, time);
  osc.frequency.exponentialRampToValueAtTime(70, time + 0.10);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.40, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(time); osc.stop(time + 0.22);
}

// ── Kit: marimba ─────────────────────────────────────────────────────────────

function synthMarimbaHi(time) {
  sinePartials(time, [
    { freq: 523,  amp: 0.20, decay: 0.45 },
    { freq: 2092, amp: 0.08, decay: 0.20 },
    { freq: 5230, amp: 0.03, decay: 0.10 },
  ]);
}
function synthMarimbaMid(time) {
  sinePartials(time, [
    { freq: 392,  amp: 0.20, decay: 0.55 },
    { freq: 1568, amp: 0.08, decay: 0.25 },
    { freq: 3920, amp: 0.03, decay: 0.12 },
  ]);
}
function synthMarimbaLo(time) {
  sinePartials(time, [
    { freq: 261,  amp: 0.22, decay: 0.70 },
    { freq: 1044, amp: 0.09, decay: 0.30 },
    { freq: 2610, amp: 0.03, decay: 0.15 },
  ]);
}

// ── Canvas animation ─────────────────────────────────────────────────────────

const canvas   = document.getElementById('canvas');
const canvasCx = canvas.getContext('2d');
let rings = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  rings.length = 0; // H3: clear stale ring positions
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const RING_STROKE_W     = [5, 4, 3];
const RING_DURATION_SEC = 0.4;
const RING_MAX_RADIUS   = 0.20;
const RING_COLORS       = [
  '255, 190, 60',   // amber — BELL
  '60, 210, 180',   // teal  — BEAT 1
  '255, 90, 110',   // rose  — BEAT 2
];

const POSITION_LAYOUTS = {
  1: [0.50],
  2: [0.28, 0.72],
  3: [0.18, 0.50, 0.82],
};

function getVoicePosition(voiceIdx) {
  const active = [0, 1, 2].filter(i => !voices[i].muted);
  const slot   = active.indexOf(voiceIdx);
  if (slot === -1) return null;
  const xFracs = POSITION_LAYOUTS[active.length];
  return { x: canvas.width * xFracs[slot], y: canvas.height * 0.50 };
}

function spawnRing(voiceIdx, isSync) {
  const pos = getVoicePosition(voiceIdx);
  if (!pos) return;
  const minDim = Math.min(canvas.width, canvas.height);
  rings.push({
    voice:       voiceIdx,
    cx:          pos.x,
    cy:          pos.y,
    color:       RING_COLORS[voiceIdx],
    maxRadius:   minDim * RING_MAX_RADIUS,
    strokeWidth: RING_STROKE_W[voiceIdx],
    progress:    0,
    speed:       isSync ? 1.3 : 1.0,
    alphaBoost:  isSync ? 1.4 : 1.0,
  });
}

let lastTs = null;

function animLoop(ts) {
  const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;

  canvasCx.clearRect(0, 0, canvas.width, canvas.height);

  rings = rings.filter(r => r.progress < 1);
  rings.forEach(r => {
    r.progress = Math.min(1, r.progress + (dt / RING_DURATION_SEC) * r.speed);
    const ease   = 1 - Math.pow(1 - r.progress, 3);
    const radius = r.maxRadius * ease;
    const alpha  = Math.min(1, r.alphaBoost) * (1 - r.progress);
    canvasCx.beginPath();
    canvasCx.arc(r.cx, r.cy, Math.max(0, radius), 0, Math.PI * 2);
    canvasCx.strokeStyle = `rgba(${r.color}, ${alpha.toFixed(3)})`;
    canvasCx.lineWidth   = r.strokeWidth;
    canvasCx.stroke();
  });

  requestAnimationFrame(animLoop);
}

requestAnimationFrame(animLoop);

// ── Voice state ───────────────────────────────────────────────────────────────

const BPM_MIN = 10;
const BPM_MAX = 240;

function clampBpm(v) {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v)));
}

const voices = [
  { bpm: 60,  nextTime: 0, fn: playBell, muted: false, ratioMode: false, ratio: { n: 1, d: 1 } },
  { bpm: 80,  nextTime: 0, fn: playTick, muted: false, ratioMode: false, ratio: { n: 3, d: 2 } },
  { bpm: 120, nextTime: 0, fn: playTock, muted: false, ratioMode: false, ratio: { n: 2, d: 1 } },
];

function effectiveBpm(idx) {
  const v = voices[idx];
  if (idx > 0 && v.ratioMode) {
    const d = v.ratio.d || 1; // M4: guard against zero denominator
    return voices[0].bpm * v.ratio.n / d;
  }
  return v.bpm;
}

// ── Scheduler ────────────────────────────────────────────────────────────────

const LOOKAHEAD_SEC  = 0.12;
const SCHEDULE_MS    = 50;
const SYNC_TOLERANCE = 0.012;

let running = false;
let timerId = null;

function scheduleRing(voiceIdx, audioTime, isSync) {
  const delayMs = Math.max(0, (audioTime - getCtx().currentTime) * 1000);
  setTimeout(() => spawnRing(voiceIdx, isSync), delayMs);
}

function schedule() {
  const ctx  = getCtx();
  const now  = ctx.currentTime;
  const look = now + LOOKAHEAD_SEC;
  const pending = [];

  voices.forEach((v, i) => {
    const spb = 60 / effectiveBpm(i);
    while (v.nextTime < look) {
      if (v.nextTime >= now) pending.push({ time: v.nextTime, voiceIdx: i });
      v.nextTime += spb;
    }
  });

  pending.sort((a, b) => a.time - b.time);
  const consumed = new Set();

  pending.forEach((evt, idx) => {
    if (consumed.has(idx)) return;
    const cluster = [idx];
    for (let j = idx + 1; j < pending.length; j++) {
      if (pending[j].time - evt.time <= SYNC_TOLERANCE) cluster.push(j);
      else break;
    }
    cluster.forEach(k => consumed.add(k));

    const t        = evt.time;
    const voiceSet = new Set(cluster.map(k => pending[k].voiceIdx));

    if (voiceSet.size === 3) {
      if (!voices[0].muted) playBell(t);
      scheduleRing(0, t, true);
      scheduleRing(1, t, true);
      scheduleRing(2, t, true);
    } else {
      cluster.forEach(k => {
        const vi = pending[k].voiceIdx;
        if (!voices[vi].muted) voices[vi].fn(t);
        scheduleRing(vi, t, false);
      });
    }
  });
}

function startScheduler() {
  if (timerId !== null) return; // C1: prevent duplicate intervals on rapid toggle
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume(); // H1: best-effort resume
  const now = ctx.currentTime;
  voices.forEach(v => { v.nextTime = now + 0.05; });
  timerId = setInterval(schedule, SCHEDULE_MS);
  running = true;
}

function stopScheduler() {
  clearInterval(timerId);
  timerId = null;
  running = false;
}

// ── BPM display helpers ───────────────────────────────────────────────────────

const bpmDisplays = [0, 1, 2].map(i => document.getElementById(`bpm-${i}`));
const bpmInputEls = [0, 1, 2].map(i => document.getElementById(`bpm-input-${i}`));
const sliderEls   = [0, 1, 2].map(i => document.querySelector(`.slider[data-voice="${i}"]`));
const voiceEls    = [0, 1, 2].map(i => document.querySelector(`.voice[data-voice="${i}"]`));
const paletteBtn     = document.getElementById('palette-btn');
const palettePopover = document.getElementById('palette-popover');
const kitBtn         = document.getElementById('kit-btn');
const kitPopover     = document.getElementById('kit-popover');

function refreshDisplay(idx) {
  const bpm = effectiveBpm(idx);
  const text = Number.isInteger(bpm) ? String(bpm) : bpm.toFixed(1);
  bpmDisplays[idx].textContent = text;
}

function refreshRatioDisplays() {
  [1, 2].forEach(i => { if (voices[i].ratioMode) refreshDisplay(i); });
}

// ── BPM scale tick marks ──────────────────────────────────────────────────────

const THUMB_W     = 14;
const MAJOR_TICKS = [40, 80, 120, 160, 200, 240];
const ALL_TICKS   = [10, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240];

function buildScale(voiceIdx) {
  const slider  = sliderEls[voiceIdx];
  const scaleEl = document.querySelector(`.scale[data-voice="${voiceIdx}"]`);
  if (!slider || !scaleEl) return;

  const trackW = slider.offsetWidth;
  if (trackW === 0) return;

  scaleEl.innerHTML = '';
  const usable = trackW - THUMB_W;
  const range  = BPM_MAX - BPM_MIN;

  ALL_TICKS.forEach(v => {
    const px      = THUMB_W / 2 + ((v - BPM_MIN) / range) * usable;
    const isMajor = MAJOR_TICKS.includes(v);

    const tick = document.createElement('div');
    tick.className = isMajor ? 'scale-tick major' : 'scale-tick';
    tick.style.left = `${px}px`;

    if (isMajor) {
      const label = document.createElement('span');
      label.className = 'scale-label';
      label.textContent = v;
      tick.appendChild(label);
    }

    scaleEl.appendChild(tick);
  });
}

function buildAllScales() {
  [0, 1, 2].forEach(buildScale);
}

requestAnimationFrame(() => requestAnimationFrame(buildAllScales));

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
new ResizeObserver(debounce(buildAllScales, 60)).observe(document.querySelector('.drawer')); // M3

// ── BPM click-to-edit ─────────────────────────────────────────────────────────

let cancellingEdit = false;

function openEdit(idx) {
  const input   = bpmInputEls[idx];
  const display = bpmDisplays[idx];
  input.value = Math.round(effectiveBpm(idx));
  display.classList.add('hidden');
  input.classList.remove('hidden');
  input.focus();
  input.select();
}

function commitEdit(idx) {
  if (cancellingEdit) {
    cancellingEdit = false;
    closeEdit(idx);
    return;
  }
  const raw = parseFloat(bpmInputEls[idx].value);
  const val = isNaN(raw) ? Math.round(effectiveBpm(idx)) : clampBpm(raw);

  if (idx > 0 && voices[idx].ratioMode) {
    voices[idx].ratioMode = false;
    document.querySelectorAll(`.mode-btn[data-voice="${idx}"]`).forEach(b => {
      b.classList.toggle('active', b.dataset.mode === 'fixed');
    });
    document.querySelector(`.fixed-row[data-for="${idx}"]`).classList.remove('hidden');
    document.querySelector(`.ratio-row[data-for="${idx}"]`).classList.add('hidden');
  }

  voices[idx].bpm = val;
  sliderEls[idx].value = val;
  if (idx === 0) refreshRatioDisplays();
  closeEdit(idx);
  refreshDisplay(idx);
}

function closeEdit(idx) {
  bpmDisplays[idx].classList.remove('hidden');
  bpmInputEls[idx].classList.add('hidden');
}

[0, 1, 2].forEach(idx => {
  bpmDisplays[idx].addEventListener('click', () => openEdit(idx));

  bpmInputEls[idx].addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); bpmInputEls[idx].blur(); }
    if (e.key === 'Escape') { cancellingEdit = true; bpmInputEls[idx].blur(); }
  });

  bpmInputEls[idx].addEventListener('blur', () => commitEdit(idx));
});

// ── State setters (single source of truth used by mouse, keyboard, scenes) ──

function updateSliderFill(idx) {
  const slider = sliderEls[idx];
  const pct = (slider.value - BPM_MIN) / (BPM_MAX - BPM_MIN) * 100;
  slider.style.setProperty('--fill-pct', pct + '%');
}

function setBpm(idx, bpm) {
  const v = clampBpm(bpm);
  voices[idx].bpm = v;
  sliderEls[idx].value = v;
  updateSliderFill(idx);
  refreshDisplay(idx);
  if (idx === 0) refreshRatioDisplays();
}

function setMute(idx, muted) {
  voices[idx].muted = muted;
  rings = rings.filter(r => r.voice !== idx); // M2: clear in-flight rings for this voice
  const btn = document.querySelector(`.mute-btn[data-voice="${idx}"]`);
  btn.textContent = muted ? 'MUTE' : 'ON';
  btn.classList.toggle('muted', muted);
  voiceEls[idx].classList.toggle('muted', muted);
}

function setRatioMode(idx, isRatio) {
  if (idx === 0) return;
  voices[idx].ratioMode = isRatio;
  document.querySelectorAll(`.mode-btn[data-voice="${idx}"]`).forEach(b => {
    b.classList.toggle('active', (b.dataset.mode === 'ratio') === isRatio);
  });
  document.querySelector(`.fixed-row[data-for="${idx}"]`).classList.toggle('hidden', isRatio);
  document.querySelector(`.ratio-row[data-for="${idx}"]`).classList.toggle('hidden', !isRatio);
  refreshDisplay(idx);
}

function setRatio(idx, n, d) {
  voices[idx].ratio = { n, d };
  const sel = document.querySelector(`.ratio-select[data-voice="${idx}"]`);
  if (sel) sel.value = `${n}:${d}`;
  refreshDisplay(idx);
}

// ── UI wiring ─────────────────────────────────────────────────────────────────

const startBtn = document.getElementById('start-btn');

function toggleTransport() {
  if (running) {
    stopScheduler();
    startBtn.textContent = 'START';
    startBtn.classList.remove('running');
  } else {
    startScheduler();
    startBtn.textContent = 'STOP';
    startBtn.classList.add('running');
  }
}

startBtn.addEventListener('click', toggleTransport);

// BPM sliders
sliderEls.forEach((slider, idx) => {
  updateSliderFill(idx);
  const update = () => setBpm(idx, parseInt(slider.value, 10));
  slider.addEventListener('input',  update);
  slider.addEventListener('change', update);
});

// Mode toggle
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx  = parseInt(btn.dataset.voice, 10);
    setRatioMode(idx, btn.dataset.mode === 'ratio');
  });
});

// Ratio selects
document.querySelectorAll('.ratio-select').forEach(sel => {
  const idx = parseInt(sel.dataset.voice, 10);
  const [n0, d0] = sel.value.split(':').map(Number);
  voices[idx].ratio = { n: n0, d: d0 };
  sel.addEventListener('change', () => {
    const [n, d] = sel.value.split(':').map(Number);
    setRatio(idx, n, d);
  });
});

// Mute buttons
document.querySelectorAll('.mute-btn').forEach(btn => {
  const idx = parseInt(btn.dataset.voice, 10);
  btn.addEventListener('click', () => setMute(idx, !voices[idx].muted));
});

// Drawer toggle
const drawerEl     = document.getElementById('drawer');
const drawerToggle = document.getElementById('drawer-toggle');
const sideDrawerEl = document.getElementById('side-drawer');
const sideToggle   = document.getElementById('side-toggle');

function closeDrawer() {
  drawerEl.classList.remove('open');
  drawerToggle.classList.remove('open');
  drawerToggle.setAttribute('aria-label', 'Open settings');
}

function closeSideDrawer() {
  sideDrawerEl.classList.remove('open');
  sideToggle.classList.remove('open');
  sideToggle.setAttribute('aria-label', 'Open scenes & keys');
}

drawerToggle.addEventListener('click', () => {
  const isOpen = drawerEl.classList.toggle('open');
  drawerToggle.classList.toggle('open', isOpen);
  drawerToggle.setAttribute('aria-label', isOpen ? 'Close settings' : 'Open settings');
  if (isOpen) {
    closeSideDrawer();
    if (typeof closePopover === 'function') closePopover();
    if (typeof closeKitPopover === 'function') closeKitPopover();
    requestAnimationFrame(() => requestAnimationFrame(buildAllScales));
  }
});

// ── Side drawer toggle (scenes & keys) ──────────────────────────────────────

sideToggle.addEventListener('click', () => {
  const isOpen = sideDrawerEl.classList.toggle('open');
  sideToggle.classList.toggle('open', isOpen);
  sideToggle.setAttribute('aria-label', isOpen ? 'Close scenes & keys' : 'Open scenes & keys');
  if (isOpen) {
    closeDrawer();
    if (typeof closePopover === 'function') closePopover();
    if (typeof closeKitPopover === 'function') closeKitPopover();
  }
});

// ── Storage helpers ─────────────────────────────────────────────────────────

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* quota */ }
}

// ── Action set & default bindings ───────────────────────────────────────────

const VOICE_LABELS = ['BELL', 'BEAT 1', 'BEAT 2'];

const ACTIONS = [
  { id: 'transport', group: 'transport', label: 'start / stop' },
  { id: 'mute0',     group: 'mutes',     label: 'mute bell' },
  { id: 'mute1',     group: 'mutes',     label: 'mute beat 1' },
  { id: 'mute2',     group: 'mutes',     label: 'mute beat 2' },
  // voice 0 presets
  { id: 'v0p0', group: 'bell presets',   label: 'bell · slot 1' },
  { id: 'v0p1', group: 'bell presets',   label: 'bell · slot 2' },
  { id: 'v0p2', group: 'bell presets',   label: 'bell · slot 3' },
  { id: 'v0p3', group: 'bell presets',   label: 'bell · slot 4' },
  // voice 1 presets
  { id: 'v1p0', group: 'beat 1 presets', label: 'beat 1 · slot 1' },
  { id: 'v1p1', group: 'beat 1 presets', label: 'beat 1 · slot 2' },
  { id: 'v1p2', group: 'beat 1 presets', label: 'beat 1 · slot 3' },
  { id: 'v1p3', group: 'beat 1 presets', label: 'beat 1 · slot 4' },
  // voice 2 presets
  { id: 'v2p0', group: 'beat 2 presets', label: 'beat 2 · slot 1' },
  { id: 'v2p1', group: 'beat 2 presets', label: 'beat 2 · slot 2' },
  { id: 'v2p2', group: 'beat 2 presets', label: 'beat 2 · slot 3' },
  { id: 'v2p3', group: 'beat 2 presets', label: 'beat 2 · slot 4' },
  // scenes recall
  { id: 'scene0', group: 'scenes',  label: 'recall scene 1' },
  { id: 'scene1', group: 'scenes',  label: 'recall scene 2' },
  { id: 'scene2', group: 'scenes',  label: 'recall scene 3' },
  { id: 'scene3', group: 'scenes',  label: 'recall scene 4' },
  // scenes capture
  { id: 'cap0', group: 'capture scenes', label: 'capture scene 1' },
  { id: 'cap1', group: 'capture scenes', label: 'capture scene 2' },
  { id: 'cap2', group: 'capture scenes', label: 'capture scene 3' },
  { id: 'cap3', group: 'capture scenes', label: 'capture scene 4' },
];

const DEFAULT_BINDINGS = {
  transport: 'Space',
  mute0: 'KeyQ', mute1: 'KeyW', mute2: 'KeyE',
  v0p0: 'KeyR', v0p1: 'KeyT', v0p2: 'KeyY', v0p3: 'KeyU',
  v1p0: 'KeyF', v1p1: 'KeyG', v1p2: 'KeyH', v1p3: 'KeyJ',
  v2p0: 'KeyV', v2p1: 'KeyB', v2p2: 'KeyN', v2p3: 'KeyM',
  scene0: 'Digit1', scene1: 'Digit2', scene2: 'Digit3', scene3: 'Digit4',
  cap0: 'Shift+Digit1', cap1: 'Shift+Digit2', cap2: 'Shift+Digit3', cap3: 'Shift+Digit4',
};

const DEFAULT_PRESETS = [
  [60,  80,  100, 120],
  [80,  120, 160, 200],
  [100, 140, 180, 220],
];

let bindings = Object.assign({}, DEFAULT_BINDINGS, loadJSON('trinome.bindings', {}));
let presets  = loadJSON('trinome.presets', DEFAULT_PRESETS);
let scenes   = loadJSON('trinome.scenes',  [null, null, null, null]);

function persistBindings() { saveJSON('trinome.bindings', bindings); }
function persistPresets()  { saveJSON('trinome.presets',  presets); }
function persistScenes()   { saveJSON('trinome.scenes',   scenes); }

// ── Sound kits ───────────────────────────────────────────────────────────────

const KITS = {
  classic: { name: 'classic', desc: 'bell  ·  wood hi  ·  wood lo',     fns: [synthBell,      synthWoodHi,    synthWoodLo]    },
  kalimba: { name: 'kalimba', desc: 'kalimba hi  ·  mid  ·  lo',        fns: [synthKalimbaHi, synthKalimbaMid, synthKalimbaLo] },
  tabla:   { name: 'tabla',   desc: 'hand drum hi  ·  mid  ·  lo',      fns: [synthTablaHi,   synthTablaMid,  synthTablaLo]   },
  marimba: { name: 'marimba', desc: 'marimba C5  ·  G4  ·  C4',         fns: [synthMarimbaHi, synthMarimbaMid, synthMarimbaLo] },
};

let kitState = loadJSON('trinome.kit', 'classic');
if (!KITS[kitState]) kitState = 'classic';

function applyKit(kitId, { persist = true } = {}) {
  kitState = kitId;
  const kit = KITS[kitId];
  voices.forEach((v, i) => { v.fn = kit.fns[i]; });
  if (persist) saveJSON('trinome.kit', kitId);
  if (typeof renderKitPopover === 'function') renderKitPopover();
}

// ── Palette & theme ─────────────────────────────────────────────────────────

const PALETTES = {
  signal: { name: 'signal', colors: [[255,190,60], [60,210,180], [255,90,110]] },
  sunset: { name: 'sunset', colors: [[255,140,70], [245,90,140], [130,80,200]] },
  ocean:  { name: 'ocean',  colors: [[70,200,230], [80,150,255], [130,100,240]] },
  forest: { name: 'forest', colors: [[200,220,90], [90,200,140], [50,160,180]] },
  mono:   { name: 'mono',   colors: [[220,220,220], [170,170,170], [110,110,120]] },
};

let _rawPalette = loadJSON('trinome.palette', PALETTES.signal);
// C2: validate palette structure to prevent crash on corrupted localStorage
if (!_rawPalette || !Array.isArray(_rawPalette.colors) || _rawPalette.colors.length < 3) {
  _rawPalette = PALETTES.signal;
}
let paletteState = _rawPalette;
let themeState   = loadJSON('trinome.theme', null);
if (themeState !== 'light' && themeState !== 'dark') {
  themeState = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyPalette(p, { persist = true } = {}) {
  paletteState = p;
  for (let i = 0; i < 3; i++) {
    const rgb = p.colors[i].join(', ');
    document.documentElement.style.setProperty('--c' + i, rgb);
    RING_COLORS[i] = rgb;
  }
  if (persist) saveJSON('trinome.palette', p);
  if (typeof renderPalettePopover === 'function') renderPalettePopover();
}

function applyTheme(theme, { persist = true } = {}) {
  themeState = theme;
  document.body.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '☀' : '☾'; // ☀ / ☾
  if (persist) saveJSON('trinome.theme', theme);
}

// Apply palette, theme, and kit on boot
applyPalette(paletteState, { persist: false });
applyTheme(themeState, { persist: false });
applyKit(kitState, { persist: false });

// ── Action functions ────────────────────────────────────────────────────────

function applyPreset(voiceIdx, presetIdx) {
  const val = presets[voiceIdx]?.[presetIdx];
  if (typeof val !== 'number') return;
  // jumping to a fixed BPM also exits ratio mode (typed-BPM edit does this too)
  if (voices[voiceIdx].ratioMode) setRatioMode(voiceIdx, false);
  setBpm(voiceIdx, val);
  flashVoicePanel(voiceIdx);
}

function captureScene(slot) {
  scenes[slot] = {
    voices: voices.map(v => ({
      bpm: v.bpm,
      muted: v.muted,
      ratioMode: v.ratioMode,
      ratio: { n: v.ratio.n, d: v.ratio.d },
    })),
  };
  persistScenes();
  renderScenes();
  flashSceneCard(slot, 'capture');
}

function recallScene(slot) {
  const s = scenes[slot];
  if (!s || !Array.isArray(s.voices) || s.voices.length !== 3) return; // C3
  s.voices.forEach((sv, i) => {
    setRatio(i, sv.ratio.n, sv.ratio.d);
    setRatioMode(i, sv.ratioMode);
    setBpm(i, sv.bpm);
    setMute(i, sv.muted);
  });
  if (running) { // H2: re-align nextTime to avoid beat bunching after BPM change
    const now = getCtx().currentTime;
    voices.forEach((v, i) => { v.nextTime = now + 60 / effectiveBpm(i); });
  }
  flashSceneCard(slot, 'recall');
}

const actionFns = {
  transport: toggleTransport,
  mute0: () => setMute(0, !voices[0].muted),
  mute1: () => setMute(1, !voices[1].muted),
  mute2: () => setMute(2, !voices[2].muted),
};
for (let vi = 0; vi < 3; vi++) {
  for (let pi = 0; pi < 4; pi++) {
    actionFns[`v${vi}p${pi}`] = () => applyPreset(vi, pi);
  }
}
for (let si = 0; si < 4; si++) {
  actionFns[`scene${si}`] = () => recallScene(si);
  actionFns[`cap${si}`]   = () => captureScene(si);
}

// ── Keyboard router ─────────────────────────────────────────────────────────

let chordToAction = new Map();

function rebuildChordMap() {
  chordToAction = new Map();
  for (const [actionId, chord] of Object.entries(bindings)) {
    if (chord) chordToAction.set(chord, actionId);
  }
}
rebuildChordMap();

function isEditableFocus(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

let rebindMode = null; // { actionId, chipEl } when active

function chordFromEvent(e) {
  if (e.ctrlKey || e.altKey || e.metaKey) return null; // ignore OS-conflicting modifiers
  return (e.shiftKey ? 'Shift+' : '') + e.code;
}

function prettyChord(chord) {
  if (!chord) return '—';
  return chord
    .replace('Shift+', '⇧ ')
    .replace(/^Key/, '')
    .replace(/^Digit/, '')
    .replace(/^Space$/, 'space')
    .toLowerCase();
}

window.addEventListener('keydown', e => {
  if (rebindMode) {
    // ignore pure modifier keypresses
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' ||
        e.code === 'ControlLeft' || e.code === 'ControlRight' ||
        e.code === 'AltLeft' || e.code === 'AltRight' ||
        e.code === 'MetaLeft' || e.code === 'MetaRight') return;
    // M1: if Escape pressed without a modifier, cancel rebind (can't bind bare Escape);
    //     Shift+Escape is a valid bindable chord and falls through to commitRebind.
    if (e.key === 'Escape' && !e.shiftKey) {
      cancelRebind();
      e.preventDefault();
      return;
    }
    const chord = chordFromEvent(e);
    if (!chord) return;
    e.preventDefault();
    commitRebind(chord);
    return;
  }

  if (isEditableFocus(e.target)) return;

  const chord = chordFromEvent(e);
  if (!chord) return;
  const actionId = chordToAction.get(chord);
  if (!actionId) return;
  e.preventDefault();
  actionFns[actionId]();
});

// ── Visual flash helpers ────────────────────────────────────────────────────

const voiceFlashTimers = [null, null, null];
function flashVoicePanel(idx) {
  const el = voiceEls[idx];
  if (!el) return;
  el.classList.add('flash-key');
  clearTimeout(voiceFlashTimers[idx]);
  voiceFlashTimers[idx] = setTimeout(() => el.classList.remove('flash-key'), 110);
}

const sceneFlashTimers = [null, null, null, null];
function flashSceneCard(slot, kind) {
  const card = document.querySelector(`.scene-card[data-slot="${slot}"]`);
  if (!card) return;
  const cls = kind === 'capture' ? 'flash-capture' : 'flash-recall';
  card.classList.add(cls);
  clearTimeout(sceneFlashTimers[slot]);
  sceneFlashTimers[slot] = setTimeout(() => card.classList.remove(cls), 220);
}

// ── Side drawer rendering ───────────────────────────────────────────────────

const sceneGridEl   = document.getElementById('scene-grid');
const presetsListEl = document.getElementById('presets-list');
const bindingsEl    = document.getElementById('bindings-list');

function renderScenes() {
  sceneGridEl.innerHTML = '';
  scenes.forEach((s, slot) => {
    const card = document.createElement('div');
    card.className = 'scene-card' + (s ? '' : ' empty');
    card.dataset.slot = slot;

    const head = document.createElement('div');
    head.className = 'scene-card-head';
    const num = document.createElement('span');
    num.className = 'scene-card-num';
    num.textContent = `scene ${slot + 1}`;
    head.appendChild(num);
    const recallKeyChip = makeKeyChip(`scene${slot}`);
    head.appendChild(recallKeyChip);
    card.appendChild(head);

    if (s) {
      const preview = document.createElement('div');
      preview.className = 'scene-preview';
      s.voices.forEach((sv, i) => {
        const pip = document.createElement('span');
        pip.className = 'scene-pip' + (sv.muted ? ' muted' : '');
        pip.dataset.voice = i;
        pip.innerHTML = `<span class="scene-pip-dot"></span><span class="scene-pip-val">${Math.round(sv.bpm)}</span>`;
        preview.appendChild(pip);
      });
      card.appendChild(preview);
    } else {
      const empty = document.createElement('div');
      empty.className = 'scene-empty-label';
      empty.textContent = 'empty';
      card.appendChild(empty);
    }

    const foot = document.createElement('div');
    foot.className = 'scene-card-foot';
    const capBtn = document.createElement('button');
    capBtn.className = 'scene-capture-btn';
    capBtn.textContent = 'capture';
    capBtn.addEventListener('click', e => { e.stopPropagation(); captureScene(slot); });
    foot.appendChild(capBtn);
    const capChip = makeKeyChip(`cap${slot}`);
    foot.appendChild(capChip);
    card.appendChild(foot);

    card.addEventListener('click', () => { if (scenes[slot]) recallScene(slot); });
    sceneGridEl.appendChild(card);
  });
}

function renderPresets() {
  presetsListEl.innerHTML = '';
  for (let vi = 0; vi < 3; vi++) {
    const row = document.createElement('div');
    row.className = 'presets-row';
    row.dataset.voice = vi;

    const label = document.createElement('span');
    label.className = 'presets-row-label';
    label.textContent = VOICE_LABELS[vi].toLowerCase();
    row.appendChild(label);

    for (let pi = 0; pi < 4; pi++) {
      const slot = document.createElement('div');
      slot.className = 'preset-slot';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'preset-slot-val';
      input.min = BPM_MIN;
      input.max = BPM_MAX;
      input.value = presets[vi][pi];
      input.addEventListener('change', () => {
        const v = clampBpm(parseFloat(input.value) || presets[vi][pi]); // H4: was parseInt
        presets[vi][pi] = v;
        input.value = v;
        persistPresets();
      });
      slot.appendChild(input);

      const key = document.createElement('span');
      key.className = 'preset-slot-key';
      key.textContent = prettyChord(bindings[`v${vi}p${pi}`]);
      slot.appendChild(key);

      row.appendChild(slot);
    }
    presetsListEl.appendChild(row);
  }
}

function makeKeyChip(actionId) {
  const chip = document.createElement('button');
  chip.className = 'key-chip';
  chip.dataset.actionId = actionId;
  chip.textContent = prettyChord(bindings[actionId]);
  chip.addEventListener('click', e => {
    e.stopPropagation();
    beginRebind(actionId, chip);
  });
  return chip;
}

function renderBindings() {
  bindingsEl.innerHTML = '';
  const groups = {};
  ACTIONS.forEach(a => {
    if (!groups[a.group]) groups[a.group] = [];
    groups[a.group].push(a);
  });
  Object.entries(groups).forEach(([groupName, actions]) => {
    const g = document.createElement('div');
    g.className = 'bindings-group';
    const title = document.createElement('div');
    title.className = 'bindings-group-title';
    title.textContent = groupName;
    g.appendChild(title);
    actions.forEach(a => {
      const row = document.createElement('div');
      row.className = 'binding-row';
      const lab = document.createElement('span');
      lab.className = 'binding-label';
      lab.textContent = a.label;
      row.appendChild(lab);
      row.appendChild(makeKeyChip(a.id));
      g.appendChild(row);
    });
    bindingsEl.appendChild(g);
  });
}

function refreshAllChips() {
  // re-render the parts that show binding chips
  renderScenes();
  renderPresets();
  renderBindings();
}

// ── Rebind mode ─────────────────────────────────────────────────────────────

function beginRebind(actionId, chipEl) {
  if (rebindMode) cancelRebind();
  rebindMode = { actionId, chipEl };
  chipEl.classList.add('capturing');
  chipEl.textContent = 'press a key…';
}

function cancelRebind() {
  if (!rebindMode) return;
  rebindMode.chipEl.classList.remove('capturing');
  rebindMode.chipEl.textContent = prettyChord(bindings[rebindMode.actionId]);
  rebindMode = null;
}

function commitRebind(chord) {
  if (!rebindMode) return;
  // If chord already bound to another action, clear that binding to avoid duplicates
  const existing = chordToAction.get(chord);
  if (existing && existing !== rebindMode.actionId) {
    bindings[existing] = '';
  }
  bindings[rebindMode.actionId] = chord;
  rebindMode.chipEl.classList.remove('capturing');
  rebindMode = null;
  persistBindings();
  rebuildChordMap();
  refreshAllChips();
}

// Initial render
renderScenes();
renderPresets();
renderBindings();

// ── Theme toggle wiring ─────────────────────────────────────────────────────

const themeBtn = document.getElementById('theme-toggle');
themeBtn.textContent = themeState === 'light' ? '☀' : '☾';
themeBtn.addEventListener('click', () => {
  applyTheme(themeState === 'light' ? 'dark' : 'light');
});

// ── Palette popover wiring ──────────────────────────────────────────────────

let popoverOpen = false;

function paletteRgbToHex(rgb) {
  const [r, g, b] = rgb;
  return '#' + [r, g, b].map(n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function renderPalettePopover() {
  palettePopover.innerHTML = '';
  const presets = Object.values(PALETTES);
  const currentName = paletteState.name;

  presets.forEach(p => {
    const row = document.createElement('div');
    row.className = 'palette-row' + (currentName === p.name ? ' active' : '');
    const sw = document.createElement('div');
    sw.className = 'palette-row-swatches';
    p.colors.forEach(c => {
      const dot = document.createElement('span');
      dot.className = 'palette-row-swatch';
      dot.style.background = `rgb(${c.join(',')})`;
      sw.appendChild(dot);
    });
    row.appendChild(sw);
    const name = document.createElement('span');
    name.className = 'palette-row-name';
    name.textContent = p.name;
    row.appendChild(name);
    if (currentName === p.name) {
      const check = document.createElement('span');
      check.className = 'palette-row-check';
      check.textContent = '✓';
      row.appendChild(check);
    }
    row.addEventListener('click', () => {
      applyPalette({ name: p.name, colors: p.colors.map(c => c.slice()) });
      closePopover();
    });
    palettePopover.appendChild(row);
  });

  // Custom row (header)
  const customRow = document.createElement('div');
  customRow.className = 'palette-row' + (currentName === 'custom' ? ' active' : '');
  const csw = document.createElement('div');
  csw.className = 'palette-row-swatches';
  paletteState.colors.forEach(c => {
    const dot = document.createElement('span');
    dot.className = 'palette-row-swatch';
    dot.style.background = `rgb(${c.join(',')})`;
    csw.appendChild(dot);
  });
  customRow.appendChild(csw);
  const cname = document.createElement('span');
  cname.className = 'palette-row-name';
  cname.textContent = 'custom';
  customRow.appendChild(cname);
  if (currentName === 'custom') {
    const check = document.createElement('span');
    check.className = 'palette-row-check';
    check.textContent = '✓';
    customRow.appendChild(check);
  }
  customRow.addEventListener('click', () => {
    if (currentName !== 'custom') {
      applyPalette({ name: 'custom', colors: paletteState.colors.map(c => c.slice()) });
    }
  });
  palettePopover.appendChild(customRow);

  // 3 color pickers
  const pickerWrap = document.createElement('div');
  pickerWrap.className = 'palette-custom-pickers';
  VOICE_LABELS.forEach((label, i) => {
    const cell = document.createElement('div');
    cell.className = 'palette-picker-cell';
    const input = document.createElement('input');
    input.type = 'color';
    input.value = paletteRgbToHex(paletteState.colors[i]);
    input.addEventListener('input', () => {
      const rgb = hexToRgb(input.value);
      if (!rgb) return;
      const newColors = paletteState.colors.map(c => c.slice());
      newColors[i] = rgb;
      applyPalette({ name: 'custom', colors: newColors });
    });
    const cap = document.createElement('label');
    cap.textContent = label.toLowerCase();
    cell.appendChild(input);
    cell.appendChild(cap);
    pickerWrap.appendChild(cell);
  });
  palettePopover.appendChild(pickerWrap);
}

function openPopover() {
  popoverOpen = true;
  palettePopover.hidden = false;
  paletteBtn.classList.add('open');
  closeDrawer();
  closeSideDrawer();
  if (typeof closeKitPopover === 'function') closeKitPopover();
  renderPalettePopover();
}

function closePopover() {
  popoverOpen = false;
  palettePopover.hidden = true;
  paletteBtn.classList.remove('open');
}

paletteBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (popoverOpen) closePopover(); else openPopover();
});

document.addEventListener('click', e => {
  if (popoverOpen && !palettePopover.contains(e.target) && !paletteBtn.contains(e.target)) closePopover();
  if (kitPopoverOpen && !kitPopover.contains(e.target) && !kitBtn.contains(e.target)) closeKitPopover();
});

document.addEventListener('keydown', e => {
  if (popoverOpen && e.key === 'Escape') closePopover();
  if (kitPopoverOpen && e.key === 'Escape') closeKitPopover();
});

// ── Sound kit popover wiring ─────────────────────────────────────────────────

let kitPopoverOpen = false;

function renderKitPopover() {
  kitPopover.innerHTML = '';
  Object.values(KITS).forEach(kit => {
    const row = document.createElement('div');
    row.className = 'kit-row' + (kitState === kit.name ? ' active' : '');
    const text = document.createElement('div');
    text.className = 'kit-row-text';
    const name = document.createElement('span');
    name.className = 'kit-row-name';
    name.textContent = kit.name;
    const desc = document.createElement('span');
    desc.className = 'kit-row-desc';
    desc.textContent = kit.desc;
    text.appendChild(name);
    text.appendChild(desc);
    row.appendChild(text);
    if (kitState === kit.name) {
      const check = document.createElement('span');
      check.className = 'kit-row-check';
      check.textContent = '✓';
      row.appendChild(check);
    }
    row.addEventListener('click', () => {
      applyKit(kit.name);
      closeKitPopover();
    });
    kitPopover.appendChild(row);
  });
}

function openKitPopover() {
  kitPopoverOpen = true;
  kitPopover.hidden = false;
  kitBtn.classList.add('open');
  closeDrawer();
  closeSideDrawer();
  closePopover();
  renderKitPopover();
}

function closeKitPopover() {
  kitPopoverOpen = false;
  kitPopover.hidden = true;
  kitBtn.classList.remove('open');
}

kitBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (kitPopoverOpen) closeKitPopover(); else openKitPopover();
});
