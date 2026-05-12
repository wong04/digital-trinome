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

// ── Canvas animation ─────────────────────────────────────────────────────────

const canvas   = document.getElementById('canvas');
const canvasCx = canvas.getContext('2d');
let rings = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
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
    return voices[0].bpm * v.ratio.n / v.ratio.d;
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
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
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
new ResizeObserver(buildAllScales).observe(document.querySelector('.drawer'));

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

// ── UI wiring ─────────────────────────────────────────────────────────────────

const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', () => {
  if (running) {
    stopScheduler();
    startBtn.textContent = 'START';
    startBtn.classList.remove('running');
  } else {
    startScheduler();
    startBtn.textContent = 'STOP';
    startBtn.classList.add('running');
  }
});

// BPM sliders
sliderEls.forEach((slider, idx) => {
  const updateFill = () => {
    const pct = (slider.value - BPM_MIN) / (BPM_MAX - BPM_MIN) * 100;
    slider.style.setProperty('--fill-pct', pct + '%');
  };
  updateFill();
  const update = () => {
    voices[idx].bpm = clampBpm(parseInt(slider.value, 10));
    refreshDisplay(idx);
    if (idx === 0) refreshRatioDisplays();
    updateFill();
  };
  slider.addEventListener('input',  update);
  slider.addEventListener('change', update);
});

// Mode toggle
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx  = parseInt(btn.dataset.voice, 10);
    const mode = btn.dataset.mode;
    voices[idx].ratioMode = (mode === 'ratio');

    btn.closest('.mode-toggle').querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    document.querySelector(`.fixed-row[data-for="${idx}"]`).classList.toggle('hidden', mode === 'ratio');
    document.querySelector(`.ratio-row[data-for="${idx}"]`).classList.toggle('hidden', mode === 'fixed');

    refreshDisplay(idx);
  });
});

// Ratio selects
document.querySelectorAll('.ratio-select').forEach(sel => {
  const idx = parseInt(sel.dataset.voice, 10);
  const init = () => {
    const [n, d] = sel.value.split(':').map(Number);
    voices[idx].ratio = { n, d };
  };
  init();
  sel.addEventListener('change', () => { init(); refreshDisplay(idx); });
});

// Mute buttons
document.querySelectorAll('.mute-btn').forEach(btn => {
  const idx = parseInt(btn.dataset.voice, 10);
  btn.addEventListener('click', () => {
    voices[idx].muted = !voices[idx].muted;
    btn.textContent = voices[idx].muted ? 'MUTE' : 'ON';
    btn.classList.toggle('muted', voices[idx].muted);
    voiceEls[idx].classList.toggle('muted', voices[idx].muted);
  });
});

// Drawer toggle
const drawerEl     = document.getElementById('drawer');
const drawerToggle = document.getElementById('drawer-toggle');

drawerToggle.addEventListener('click', () => {
  const isOpen = drawerEl.classList.toggle('open');
  drawerToggle.classList.toggle('open', isOpen);
  drawerToggle.setAttribute('aria-label', isOpen ? 'Close settings' : 'Open settings');
  if (isOpen) requestAnimationFrame(() => requestAnimationFrame(buildAllScales));
});
