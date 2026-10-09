// YBK Beat Sketch: describe a beat, get a starting point built from YBK samples, edit it, export it.
'use strict';

// ---------- text ----------
const T = {
  en: {
    h1: 'Describe a beat. Hear it now. Make it yours.',
    sub: 'Free, in your browser, nothing to install. Every sound is a YBK AUDIO sample.',
    ph: 'e.g. lo-fi drums with warm piano',
    make: 'Make a beat', tempo: 'Tempo', swing: 'Swing', kit: 'Kit', key: 'Key', vinyl: 'Vinyl',
    again: 'Try another', share: 'Copy link', expLoop: 'Download loop (WAV)', expSong: 'Download full track (WAV)',
    own: 'What you make here is yours. Use it in releases, videos and streams, royalty free.',
    heard: 'Heard:', loop: 'Loop', songMode: 'Full track', resume: 'Continue your last beat',
    loading: 'Loading sounds…', rendering: 'Rendering…', copied: 'Link copied', saved: 'Saved',
    noMatch: 'No style word found, starting with lo-fi. Try "trap", "house", "boom bap" or "techno".',
    rows: { kick: 'Kick', snare: 'Snare', clap: 'Clap', hat: 'Hi-hat', ohat: 'Open hat', perc: 'Perc', bass: '808 Bass', keys: 'Keys' },
    perc: { rim: 'Rim', shaker: 'Shaker', conga: 'Conga', ride: 'Ride' },
    secs: { intro: 'Intro', main: 'Main', break: 'Break', outro: 'Outro' },
    major: 'major', minor: 'minor', bar: 'Bar',
    examples: ['lo-fi drums with warm piano', 'dark trap 140 bpm', 'happy house for a summer video', 'dusty 90s boom bap, jazzy', 'driving techno, minimal'],
    tags: { warm: 'warm keys', bright: 'bright keys', vinyl: 'vinyl', jazzy: 'jazzy chords', busy: 'busier drums', sparse: 'laid back' },
  },
  ko: {
    h1: '원하는 비트를 말하면, 바로 들리고, 내 것으로 완성돼요.',
    sub: '무료, 브라우저에서 바로, 설치 없음. 모든 소리는 YBK AUDIO 샘플이에요.',
    ph: '예: 따뜻한 피아노가 들어간 로파이 드럼',
    make: '비트 만들기', tempo: '템포', swing: '스윙', kit: '키트', key: '키', vinyl: 'LP 잡음',
    again: '다른 버전', share: '링크 복사', expLoop: '루프 받기 (WAV)', expSong: '완성곡 받기 (WAV)',
    own: '여기서 만든 음악은 당신 거예요. 발매, 영상, 방송에 저작권료 없이 쓸 수 있어요.',
    heard: '이렇게 이해했어요:', loop: '루프', songMode: '완성곡', resume: '지난번 비트 이어서 하기',
    loading: '소리 불러오는 중…', rendering: '만드는 중…', copied: '링크를 복사했어요', saved: '저장됨',
    noMatch: '장르 단어가 없어서 로파이로 시작했어요. "트랩", "하우스", "붐뱁", "테크노"도 써 보세요.',
    rows: { kick: '킥', snare: '스네어', clap: '클랩', hat: '하이햇', ohat: '오픈햇', perc: '퍼크', bass: '808 베이스', keys: '건반' },
    perc: { rim: '림', shaker: '셰이커', conga: '콩가', ride: '라이드' },
    secs: { intro: '인트로', main: '메인', break: '브레이크', outro: '아웃트로' },
    major: '장조', minor: '단조', bar: '마디',
    examples: ['따뜻한 피아노 로파이', '어두운 트랩 140', '여름 영상용 밝은 하우스', '재즈풍 90년대 붐뱁', '미니멀 테크노'],
    tags: { warm: '따뜻한 건반', bright: '밝은 건반', vinyl: 'LP 잡음', jazzy: '재즈 코드', busy: '꽉 찬 드럼', sparse: '여유로운 드럼' },
  },
};
let lang = (() => { let saved = null; try { saved = localStorage.getItem('ybk-lang'); } catch {} return saved || ((navigator.language || '').startsWith('ko') ? 'ko' : 'en'); })();
const t = (k) => T[lang][k];

// ---------- music data ----------
const GENRES = {
  lofi:    { name: 'Lo-fi',    bpm: [76, 88],   swing: 22, minor: true,  ext: 4, tone: 'warm',   vinyl: true,  perc: 'shaker', keysGate: 0,   bassGate: 0.9 },
  boombap: { name: 'Boom bap', bpm: [86, 96],   swing: 14, minor: true,  ext: 4, tone: 'warm',   vinyl: false, perc: 'rim',    keysGate: 0,   bassGate: 0.7 },
  trap:    { name: 'Trap',     bpm: [130, 150], swing: 0,  minor: true,  ext: 3, tone: 'bright', vinyl: false, perc: 'rim',    keysGate: 0,   bassGate: 1.6 },
  house:   { name: 'House',    bpm: [120, 126], swing: 6,  minor: false, ext: 4, tone: 'bright', vinyl: false, perc: 'shaker', keysGate: 1.5, bassGate: 0.28 },
  techno:  { name: 'Techno',   bpm: [126, 134], swing: 0,  minor: true,  ext: 3, tone: 'warm',   vinyl: false, perc: 'rim',    keysGate: 1,   bassGate: 0.18 },
};
const WORDS = {
  lofi: ['lofi', 'lo-fi', 'lo fi', 'chillhop', 'study', '로파이', '로우파이', '공부'],
  boombap: ['boom bap', 'boombap', 'boom-bap', '90s', "90's", 'hip hop', 'hiphop', 'hip-hop', 'old school', 'oldschool', '붐뱁', '힙합', '90년대', '올드스쿨'],
  trap: ['trap', 'drill', '808', 'rage', '트랩', '드릴'],
  house: ['house', 'disco', 'dance', 'garage', 'club', '하우스', '디스코', '댄스', '클럽'],
  techno: ['techno', 'industrial', 'warehouse', 'rave', '테크노', '레이브'],
};
const MOODS = {
  dark: ['dark', 'sad', 'moody', 'melanch', 'night', 'emotional', 'gloomy', '어두', '슬픈', '슬프', '우울', '감성', '밤'],
  happy: ['happy', 'bright', 'sunny', 'upbeat', 'summer', 'uplifting', 'cheer', '밝은', '밝게', '신나', '행복', '여름', '경쾌'],
  chill: ['chill', 'calm', 'slow', 'relax', 'sleep', 'mellow', 'soft', 'laid', '잔잔', '느린', '편안', '차분', '수면', '느긋'],
  hype: ['energetic', 'fast', 'hype', 'party', 'hard', 'aggressive', 'driving', 'banger', '빠른', '강한', '파티', '세게', '에너지'],
  jazzy: ['jazz', 'jazzy', 'soul', 'neo', '재즈', '소울'],
  vinyl: ['vinyl', 'dusty', 'vintage', 'tape', 'crackle', 'old', 'lp', '빈티지', '먼지', '테이프', '엘피'],
  warm: ['warm', 'soft piano', 'rhodes', 'mellow', '따뜻', '포근'],
  bright: ['bell', 'bright', 'pluck', 'shiny', '벨', '반짝'],
  nokeys: ['drums only', 'only drums', 'no piano', 'no keys', '드럼만'],
  minimal: ['minimal', 'sparse', 'simple', '미니멀', '단순'],
};
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const PROGS = {
  major: [[1, 4, 0, 5], [0, 5, 3, 4], [3, 4, 2, 5], [0, 3, 5, 4], [3, 2, 1, 0]],
  minor: [[0, 5, 2, 6], [0, 3, 6, 2], [5, 6, 0, 0], [0, 6, 5, 6], [3, 4, 0, 0], [0, 3, 0, 5]],
};
const DRUMS = ['kick', 'snare', 'clap', 'hat', 'ohat', 'perc'];
const ROWS = [...DRUMS, 'bass', 'keys'];
const COLORS = { kick: 'var(--kick)', snare: 'var(--snare)', clap: 'var(--clap)', hat: 'var(--hat)', ohat: 'var(--ohat)', perc: 'var(--perc)', bass: 'var(--bass)', keys: 'var(--keys)' };
const DEF_VOL = { kick: 1, snare: 0.8, clap: 0.65, hat: 0.45, ohat: 0.4, perc: 0.45, bass: 0.8, keys: 0.55 };
const PERCS = ['rim', 'shaker', 'conga', 'ride'];
// Full-track arrangement: which rows play in each section.
const SONG = [
  { id: 'intro', bars: 4, rows: ['keys', 'hat', 'perc'] },
  { id: 'main', bars: 8, rows: ROWS },
  { id: 'break', bars: 4, rows: ['keys', 'bass', 'hat', 'perc', 'ohat'] },
  { id: 'main', bars: 8, rows: ROWS },
  { id: 'outro', bars: 4, rows: ['keys', 'perc'], fade: true },
];
const SONG_BARS = SONG.reduce((a, s) => a + s.bars, 0);

// ---------- helpers ----------
function rngFrom(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const has = (s, list) => list.some((w) => s.includes(w));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = (id) => document.getElementById(id);
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800); }

// ---------- metrics (first sound / return / export), local + Vercel analytics if present ----------
function track(name, props = {}) {
  try { if (window.va) window.va('event', { name, data: props }); } catch {}
  try { const k = 'ybk-ev-' + name; localStorage.setItem(k, String(1 + Number(localStorage.getItem(k) || 0))); } catch {}
}
(function visit() {
  try {
    const now = Date.now(); const first = Number(localStorage.getItem('ybk-first') || 0); const last = Number(localStorage.getItem('ybk-last') || 0);
    if (!first) { localStorage.setItem('ybk-first', String(now)); track('visit_new'); }
    else if (now - last > 6 * 3600 * 1000) track('visit_return', { days: Math.round((now - first) / 864e5) });
    localStorage.setItem('ybk-last', String(now));
  } catch {}
})();

// ---------- prompt -> settings ----------
function parsePrompt(text) {
  const s = ' ' + text.toLowerCase() + ' ';
  let genre = null, best = -1;
  for (const g in WORDS) { const i = Math.min(...WORDS[g].map((w) => { const j = s.indexOf(w); return j < 0 ? 1e9 : j; })); if (i < 1e9 && (best < 0 || i < best)) { best = i; genre = g; } }
  const m = {}; for (const k in MOODS) m[k] = has(s, MOODS[k]);
  let guessed = false;
  if (!genre) { guessed = true; genre = m.hype ? (m.dark ? 'trap' : 'house') : m.happy ? 'house' : 'lofi'; }
  const G = GENRES[genre];
  const bpmM = s.match(/(\d{2,3})\s*(bpm|비피엠|템포)?/);
  let bpm = null; if (bpmM) { const n = Number(bpmM[1]); if (n >= 60 && n <= 180) bpm = n; }
  const keyM = text.match(/\b([A-Ga-g])\s*(#|b|♯|♭)?\s*(minor|min|major|maj|m)?\b/);
  let root = null, minor = null;
  if (keyM && (keyM[3] || keyM[2] || /key|키/.test(s))) {
    root = (NOTE_NAMES.indexOf(keyM[1].toUpperCase()) + 12 + (keyM[2] === '#' || keyM[2] === '♯' ? 1 : keyM[2] ? -1 : 0)) % 12;
    if (keyM[3]) minor = /^m(in)?/.test(keyM[3]) && !/^maj/.test(keyM[3]);
  }
  if (/(단조|마이너)/.test(s)) minor = true; if (/(장조|메이저)/.test(s)) minor = false;
  return { genre, guessed, bpm, root, minor, m };
}

// ---------- generator ----------
function generate(text, seed) {
  const p = parsePrompt(text);
  const r = rngFrom(seed); const ch = (x) => r() < x; const pick = (a) => a[Math.floor(r() * a.length)];
  const G = GENRES[p.genre];
  const busy = p.m.hype ? 1 : (p.m.chill || p.m.minimal) ? -1 : 0;
  let bpm = p.bpm || Math.round(G.bpm[0] + r() * (G.bpm[1] - G.bpm[0]) + busy * 6);
  const minor = p.minor != null ? p.minor : p.m.dark ? true : p.m.happy ? false : G.minor;
  const root = p.root != null ? p.root : pick(minor ? [9, 4, 2, 0, 7, 5] : [0, 5, 7, 2, 10, 3]);
  const pat = {}; for (const k of ROWS) pat[k] = Array(16).fill(0);
  const on = (k, steps, v = 1) => steps.forEach((i) => { pat[k][i] = v; });
  const g = p.genre;
  if (g === 'lofi' || g === 'boombap') {
    on('kick', [0, 10]); on('kick', [pick([3, 7, 13, 15, 8])]); if (busy > 0) on('kick', [pick([6, 14])]);
    on('snare', [4, 12]); if (ch(0.5)) on('snare', [pick([7, 15, 9])], 0.4);
    for (let i = 0; i < 16; i += 2) on('hat', [i], i % 4 ? 0.6 : 1);
    if (busy >= 0) for (let i = 1; i < 16; i += 2) if (ch(busy > 0 ? 0.5 : 0.15)) on('hat', [i], 0.4);
    if (g === 'boombap' && ch(0.6)) { on('ohat', [pick([6, 14])]); }
    if (g === 'lofi' && ch(0.4)) on('clap', [12], 0.5);
    if (G.perc === 'shaker') { for (let i = 0; i < 16; i++) if (ch(0.45)) on('perc', [i], i % 2 ? 0.5 : 0.8); } else on('perc', [pick([3, 7, 11]), pick([14, 15])], 0.7);
    on('bass', pat.kick.map((v, i) => (v ? i : -1)).filter((i) => i >= 0 && ch(0.85))); pat.bass[0] = 1;
    on('keys', [0]); if (ch(0.35)) on('keys', [pick([6, 10, 14])], 0.6);
  } else if (g === 'trap') {
    on('kick', [0]); for (const i of [3, 6, 10, 11, 14]) if (ch(0.4)) on('kick', [i]);
    on('snare', [8]); on('clap', [8], 0.8);
    for (let i = 0; i < 16; i++) on('hat', [i], i % 2 ? 0.55 : 0.9);
    if (busy < 0) for (let i = 1; i < 16; i += 2) pat.hat[i] = 0;
    if (ch(0.5)) on('ohat', [pick([6, 14])], 0.7);
    if (ch(0.6)) on('perc', [pick([5, 13]), pick([11, 15])], 0.6);
    pat.bass = pat.kick.slice();
    on('keys', [0]); if (ch(0.5)) on('keys', [pick([8, 10])], 0.7);
  } else if (g === 'house') {
    on('kick', [0, 4, 8, 12]); on('clap', [4, 12]); on('ohat', [2, 6, 10, 14], 0.8);
    for (let i = 1; i < 16; i += 2) if (ch(busy > 0 ? 0.8 : 0.45)) on('hat', [i], 0.45);
    for (let i = 0; i < 16; i++) if (ch(0.5)) on('perc', [i], i % 2 ? 0.45 : 0.7);
    on('bass', [2, 6, 10, 14]); if (ch(0.5)) on('bass', [pick([3, 11, 7])], 0.8);
    on('keys', pick([[0, 3, 6], [3, 6, 10], [2, 6, 10, 14], [0, 3, 6, 10, 13]]));
  } else { // techno
    on('kick', [0, 4, 8, 12]); if (busy >= 0 && ch(0.5)) on('clap', [4, 12], 0.7);
    on('ohat', [2, 6, 10, 14], 0.8); for (let i = 0; i < 16; i++) if (i % 4 !== 2) on('hat', [i], i % 2 ? 0.35 : 0.5);
    for (const i of [3, 7, 11, 13, 15, 6]) if (ch(0.35)) on('perc', [i], 0.6);
    for (let i = 0; i < 16; i++) if (i % 4 && ch(0.7)) on('bass', [i], i % 2 ? 0.7 : 0.9);
    on('keys', pick([[3, 10], [6, 14], [2, 7, 12]]));
  }
  let prog;
  if (g === 'techno') prog = pick([[0, 0, 0, 0], [0, 0, 5, 5], [0, 0, 6, 6]]);
  else prog = pick(PROGS[minor ? 'minor' : 'major']);
  const tone = p.m.bright ? 'bright' : p.m.warm ? 'warm' : G.tone;
  const vol = { ...DEF_VOL }; if (has(' ' + text.toLowerCase() + ' ', ['bass', '808', '베이스'])) vol.bass = 1;
  const mute = {}; if (p.m.nokeys) mute.keys = true;
  const tags = [];
  if (tone !== G.tone) tags.push(tone); if ((G.vinyl || p.m.vinyl)) tags.push('vinyl'); if (p.m.jazzy) tags.push('jazzy');
  if (busy > 0) tags.push('busy'); if (busy < 0) tags.push('sparse');
  return {
    v: 1, prompt: text, seed, genre: g, kit: g, bpm: clamp(bpm, 60, 180), swing: p.m.jazzy ? Math.max(G.swing, 18) : G.swing,
    root, minor, prog, ext: p.m.jazzy ? 5 : G.ext, tone, vinyl: G.vinyl || p.m.vinyl, perc: G.perc,
    pat, vol, mute, guessed: p.guessed, tags,
  };
}

// ---------- harmony ----------
function chordNotes(st, deg) {
  const sc = SCALE[st.minor ? 'minor' : 'major'];
  const pcs = []; for (let i = 0; i < st.ext; i++) { const d = deg + i * 2; pcs.push(st.root + sc[d % 7] + 12 * Math.floor(d / 7)); }
  let notes = pcs.map((x) => x + 48); // from C3
  while (notes[0] > 55) notes = notes.map((n) => n - 12);
  while (notes[0] < 45) notes = notes.map((n) => n + 12);
  return notes;
}
function chordName(st, deg) {
  const n = chordNotes(st, deg); const r = n[0];
  const i3 = n[1] - r, i5 = n[2] - r, i7 = n[3] != null ? n[3] - r : null;
  let q = i3 === 3 ? (i5 === 6 ? 'dim' : 'm') : '';
  if (i7 != null) q = i3 === 4 ? (i7 === 11 ? 'maj7' : '7') : (i5 === 6 ? 'm7b5' : 'm7');
  if (n.length > 4) q = q.replace('7', '9');
  return NOTE_NAMES[r % 12] + q;
}

// ---------- audio ----------
let ctx = null, master = null, buffers = {}, bass808 = null;
const kitCache = {};
async function loadBuf(c, url) { const res = await fetch(url); const ab = await res.arrayBuffer(); return await c.decodeAudioData(ab); }
async function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = buildMaster(ctx, ctx.destination);
  }
  if (ctx.state === 'suspended') await ctx.resume();
}
function buildMaster(c, dest) {
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.15;
  const g = c.createGain(); g.gain.value = 0.85; g.connect(comp); comp.connect(dest); return g;
}
async function loadKit(kit) {
  if (kitCache[kit]) return kitCache[kit];
  const names = ['kick', 'snare', 'clap', 'hat', 'ohat', 'rim', 'shaker', 'ride', 'crash', 'conga'];
  const bufs = await Promise.all(names.map((n) => loadBuf(ctx, `samples/${kit}/${n}.wav`)));
  const o = {}; names.forEach((n, i) => { o[n] = bufs[i]; });
  if (!bass808) bass808 = await loadBuf(ctx, 'samples/808.wav');
  kitCache[kit] = o; return o;
}
let noiseBuf = null;
function vinylBuffer(c) {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = c.sampleRate * 4; const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0); const r = rngFrom(99);
  for (let i = 0; i < len; i++) { d[i] = (r() * 2 - 1) * 0.06; if (r() < 0.0004) { const a = (r() * 2 - 1); for (let j = 0; j < 30 && i + j < len; j++) d[i + j] += a * Math.exp(-j / 6); } }
  noiseBuf = b; return b;
}

// Voices. All take an explicit context so the same code renders live and offline.
let chokeOhat = new WeakMap();
function playDrum(c, out, buf, time, vel, gate) {
  const s = c.createBufferSource(); s.buffer = buf; const g = c.createGain(); g.gain.value = vel; s.connect(g); g.connect(out); s.start(time);
  if (gate) { g.gain.setValueAtTime(vel, time + gate); g.gain.linearRampToValueAtTime(0, time + gate + 0.03); s.stop(time + gate + 0.05); }
  return s;
}
function play808(c, out, midi, time, vel, dur) {
  const s = c.createBufferSource(); s.buffer = bass808; s.playbackRate.value = Math.pow(2, (midi - 31) / 12);
  const g = c.createGain(); g.gain.setValueAtTime(vel, time); g.gain.setValueAtTime(vel, time + Math.max(0.02, dur - 0.03)); g.gain.linearRampToValueAtTime(0, time + dur);
  s.connect(g); g.connect(out); s.start(time); s.stop(time + dur + 0.02);
}
function playKey(c, out, midi, time, dur, vel, tone) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const bright = tone === 'bright';
  const flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = 0.7;
  const base = bright ? 3200 : 1300;
  flt.frequency.setValueAtTime(base * 2.2, time); flt.frequency.exponentialRampToValueAtTime(base, time + 0.35);
  const amp = c.createGain(); const peak = 0.16 * vel; const rel = bright ? 0.35 : 0.25;
  amp.gain.setValueAtTime(0, time); amp.gain.linearRampToValueAtTime(peak, time + 0.006);
  amp.gain.setTargetAtTime(peak * (bright ? 0.25 : 0.55), time + 0.01, bright ? 0.35 : 0.9);
  amp.gain.setTargetAtTime(0, time + dur, rel / 3);
  const end = time + dur + rel + 0.1;
  const oscs = [['triangle', 1, 1, 0], ['triangle', 1, 0.6, 5], ['sine', 2, bright ? 0.35 : 0.12, 0]];
  if (bright) oscs.push(['sine', 3, 0.12, 0]);
  for (const [type, mul, gn, det] of oscs) {
    const o = c.createOscillator(); o.type = type; o.frequency.value = f * mul; o.detune.value = det;
    const g = c.createGain(); g.gain.value = gn; o.connect(g); g.connect(flt); o.start(time); o.stop(end);
  }
  flt.connect(amp); amp.connect(out);
}

// Schedules one 16th step. `bar` is the absolute bar index; `rows` (optional) limits which rows sound.
function scheduleStep(c, out, st, kit, bar, step, time, rows, sectionGain) {
  const sd = 60 / st.bpm / 4;
  const live = (k) => !st.mute[k] && (!rows || rows.includes(k));
  const vel = (k, v) => v * st.vol[k] * (sectionGain ?? 1);
  const deg = st.prog[bar % 4]; const notes = chordNotes(st, deg);
  for (const k of DRUMS) {
    const v = st.pat[k][step]; if (!v || !live(k)) continue;
    const buf = k === 'perc' ? kit[st.perc] : kit[k];
    const src = playDrum(c, out, buf, time, vel(k, v));
    if (k === 'ohat') chokeOhat.set(c, src);
    if (k === 'hat') { const o = chokeOhat.get(c); if (o) { try { o.stop(time + 0.01); } catch {} chokeOhat.delete(c); } }
  }
  const G = GENRES[st.genre];
  if (st.pat.bass[step] && live('bass')) {
    let nxt = 16; for (let i = step + 1; i < 16; i++) if (st.pat.bass[i]) { nxt = i; break; }
    const dur = Math.min((nxt - step) * sd, G.bassGate);
    let midi = 24 + ((notes[0] % 12) + 12) % 12; if (midi < 29) midi += 12;
    play808(c, out, midi, time, vel('bass', st.pat.bass[step]), dur);
  }
  if (st.pat.keys[step] && live('keys')) {
    let nxt = 16; for (let i = step + 1; i < 16; i++) if (st.pat.keys[i]) { nxt = i; break; }
    const dur = G.keysGate ? G.keysGate * sd : (nxt - step) * sd - 0.02;
    const strum = st.genre === 'lofi' || st.genre === 'boombap' ? 0.012 : 0;
    notes.forEach((n, i) => playKey(c, out, n, time + i * strum, dur, vel('keys', st.pat.keys[step]), st.tone));
  }
}
function stepTime(st, step, t0) { const sd = 60 / st.bpm / 4; return t0 + (step % 2 ? (st.swing / 100) * sd : 0); }

// ---------- live transport ----------
let S = null; // current state
let playing = false, nextTime = 0, absStep = 0, timer = null, vinylSrc = null, vinylGain = null, uiQueue = [];
function songPos(bar) { let b = bar % SONG_BARS; for (let i = 0; i < SONG.length; i++) { if (b < SONG[i].bars) return { i, sec: SONG[i], inBar: b }; b -= SONG[i].bars; } }
function scheduler() {
  const kit = kitCache[S.kit]; if (!kit) { nextTime = Math.max(nextTime, ctx.currentTime + 0.05); return; }
  while (nextTime < ctx.currentTime + 0.12) {
    const step = absStep % 16, bar = Math.floor(absStep / 16);
    let rows = null, secIdx = -1;
    if (S.playmode === 'song') { const sp = songPos(bar); rows = sp.sec.rows; secIdx = sp.i; }
    scheduleStep(ctx, master, S, kit, bar, step, stepTime(S, step, nextTime), rows);
    uiQueue.push({ time: nextTime, step, bar, secIdx });
    nextTime += 60 / S.bpm / 4; absStep++;
  }
}
let firstSoundSent = false;
async function start() {
  await ensureAudio(); await loadKit(S.kit);
  if (playing) return; playing = true; absStep = 0; nextTime = ctx.currentTime + 0.06;
  timer = setInterval(scheduler, 25); scheduler(); updateVinyl();
  $('play').textContent = '■';
  if (!firstSoundSent) { firstSoundSent = true; track('first_sound', { genre: S.genre }); }
  requestAnimationFrame(drawPlayhead);
}
function stop() {
  playing = false; clearInterval(timer); uiQueue = []; updateVinyl(); $('play').textContent = '▶';
  document.querySelectorAll('.cell.playing').forEach((e) => e.classList.remove('playing'));
  document.querySelectorAll('.chord.now,.sec.now').forEach((e) => e.classList.remove('now'));
}
function updateVinyl() {
  if (vinylSrc) { try { vinylSrc.stop(); } catch {} vinylSrc = null; }
  if (playing && S.vinyl) {
    vinylSrc = ctx.createBufferSource(); vinylSrc.buffer = vinylBuffer(ctx); vinylSrc.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
    vinylGain = ctx.createGain(); vinylGain.gain.value = 0.5; vinylSrc.connect(hp); hp.connect(vinylGain); vinylGain.connect(master); vinylSrc.start();
  }
}
let lastStep = -1;
function drawPlayhead() {
  if (!playing) return;
  let cur = null; while (uiQueue.length && uiQueue[0].time <= ctx.currentTime) cur = uiQueue.shift();
  if (cur && cur.step !== lastStep) {
    lastStep = cur.step;
    document.querySelectorAll('.cell.playing').forEach((e) => e.classList.remove('playing'));
    document.querySelectorAll(`.cell[data-s="${cur.step}"]`).forEach((e) => e.classList.add('playing'));
    document.querySelectorAll('.chord').forEach((e, i) => e.classList.toggle('now', i === cur.bar % 4));
    document.querySelectorAll('.sec').forEach((e, i) => e.classList.toggle('now', i === cur.secIdx));
  }
  requestAnimationFrame(drawPlayhead);
}

// ---------- export ----------
async function render(bars, song) {
  await ensureAudio(); const kit = await loadKit(S.kit);
  const sr = 44100, sd = 60 / S.bpm / 4, tail = 2.5;
  const len = Math.ceil((bars * 16 * sd + tail) * sr);
  const oc = new OfflineAudioContext(2, len, sr); const m = buildMaster(oc, oc.destination);
  if (S.vinyl) { const v = oc.createBufferSource(); v.buffer = vinylBuffer(oc); v.loop = true; const hp = oc.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700; const g = oc.createGain(); g.gain.value = 0.5; v.connect(hp); hp.connect(g); g.connect(m); v.start(0); v.stop(bars * 16 * sd + 0.5); }
  for (let bar = 0; bar < bars; bar++) {
    let rows = null, gain = 1;
    if (song) { const sp = songPos(bar); rows = sp.sec.rows; if (sp.sec.fade) gain = 1 - sp.inBar / sp.sec.bars * 0.8; }
    for (let step = 0; step < 16; step++) {
      const t0 = (bar * 16 + step) * sd + 0.01;
      scheduleStep(oc, m, S, kit, bar, step, stepTime(S, step, t0), rows, gain);
    }
  }
  const buf = await oc.startRendering();
  return wavBlob(buf);
}
function wavBlob(buf) {
  const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate; const dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * ch * 2, true);
  const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let peak = 0; for (const d of data) for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
  const norm = peak > 0.98 ? 0.98 / peak : 1; let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { dv.setInt16(o, clamp(data[c][i] * norm, -1, 1) * 32767, true); o += 2; }
  return new Blob([dv], { type: 'audio/wav' });
}
async function doExport(song) {
  const btn = song ? $('expSong') : $('expLoop'); const label = btn.textContent; btn.textContent = t('rendering'); btn.disabled = true;
  try {
    const blob = await render(song ? SONG_BARS : 4, song);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ybk-${S.genre}-${S.bpm}bpm-${song ? 'track' : 'loop'}.wav`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    track('export', { genre: S.genre, kind: song ? 'track' : 'loop' });
  } finally { btn.textContent = label; btn.disabled = false; }
}

// ---------- persistence ----------
function save() { try { localStorage.setItem('ybk-beat', JSON.stringify(S)); } catch {} }
function encodeState(st) { const j = JSON.stringify(st); return btoa(unescape(encodeURIComponent(j))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function decodeState(s) { try { const j = decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))); const o = JSON.parse(j); return o && o.v === 1 && o.pat ? o : null; } catch { return null; } }

// ---------- UI ----------
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach((e) => { e.textContent = t(e.dataset.t); });
  $('q').placeholder = t('ph'); $('lang').textContent = lang === 'en' ? '한국어' : 'English';
  const ex = $('examples'); ex.innerHTML = '';
  for (const e of t('examples')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = e; b.onclick = () => { $('q').value = e; make(); }; ex.appendChild(b); }
  $('mode').innerHTML = `<option value="minor">${t('minor')}</option><option value="major">${t('major')}</option>`;
  $('playmode').innerHTML = `<option value="loop">${t('loop')}</option><option value="song">${t('songMode')}</option>`;
  renderResume(); if (S) renderStudio();
}
function renderResume() {
  const el = $('resume'); el.innerHTML = '';
  if (S) return;
  let saved = null; try { saved = JSON.parse(localStorage.getItem('ybk-beat') || 'null'); } catch {}
  if (saved && saved.v === 1) { const b = document.createElement('button'); b.className = 'btn small'; b.textContent = `${t('resume')} · ${GENRES[saved.genre].name} ${saved.bpm} BPM`; b.onclick = () => { load(saved); start(); }; el.appendChild(b); }
}
function renderStudio() {
  $('studio').style.display = 'block';
  const heard = $('heard');
  const tags = [GENRES[S.genre].name, `${S.bpm} BPM`, `${NOTE_NAMES[S.root]} ${S.minor ? t('minor') : t('major')}`, ...(S.tags || []).map((x) => t('tags')[x])];
  heard.innerHTML = `<span>${t('heard')}</span>` + tags.map((x) => `<span class="tag">${x}</span>`).join('');
  if (S.guessed) heard.innerHTML += `<span style="flex-basis:100%">${t('noMatch')}</span>`;
  $('bpm').value = S.bpm; $('bpmv').textContent = S.bpm; $('swing').value = S.swing; $('swingv').textContent = S.swing + '%';
  $('kit').innerHTML = Object.keys(GENRES).map((g) => `<option value="${g}" ${g === S.kit ? 'selected' : ''}>${GENRES[g].name}</option>`).join('');
  $('root').innerHTML = NOTE_NAMES.map((n, i) => `<option value="${i}" ${i === S.root ? 'selected' : ''}>${n}</option>`).join('');
  $('mode').value = S.minor ? 'minor' : 'major'; $('vinyl').checked = !!S.vinyl; $('playmode').value = S.playmode || 'loop';
  renderChords(); renderGrid(); renderSong();
}
function renderChords() {
  const el = $('chords'); el.innerHTML = '';
  S.prog.forEach((deg, bi) => {
    const d = document.createElement('div'); d.className = 'chord';
    d.innerHTML = `<small>${t('bar')} ${bi + 1}</small><b>${chordName(S, deg)}</b>`;
    const sel = document.createElement('select');
    for (let k = 0; k < 7; k++) { const o = document.createElement('option'); o.value = k; o.textContent = chordName(S, k); if (k === deg) o.selected = true; sel.appendChild(o); }
    sel.onchange = () => { S.prog[bi] = Number(sel.value); changed(); renderChords(); };
    d.appendChild(sel); el.appendChild(d);
  });
}
function renderGrid() {
  const g = $('grid'); g.innerHTML = '';
  for (const k of ROWS) {
    const lab = document.createElement('div'); lab.className = 'rowlab';
    const nm = k === 'perc' ? t('perc')[S.perc] : t('rows')[k];
    lab.innerHTML = `<button class="mute ${S.mute[k] ? 'on' : ''}" title="Mute">M</button><span class="dot" style="background:${COLORS[k]}"></span><span class="name ${k === 'perc' ? 'cyc' : ''}">${nm}</span>`;
    const vol = document.createElement('input'); vol.type = 'range'; vol.className = 'vol'; vol.min = 0; vol.max = 1.2; vol.step = 0.05; vol.value = S.vol[k];
    vol.oninput = () => { S.vol[k] = Number(vol.value); save(); };
    lab.appendChild(vol);
    lab.querySelector('.mute').onclick = () => { S.mute[k] = !S.mute[k]; changed(); renderGrid(); };
    if (k === 'perc') lab.querySelector('.name').onclick = () => { S.perc = PERCS[(PERCS.indexOf(S.perc) + 1) % PERCS.length]; changed(); renderGrid(); };
    g.appendChild(lab);
    for (let i = 0; i < 16; i++) {
      const c = document.createElement('button'); const v = S.pat[k][i];
      c.className = 'cell' + (i % 4 === 0 ? ' beat' : '') + (v >= 0.75 ? ' on' : v > 0 ? ' ghost' : '');
      c.style.setProperty('--c', COLORS[k]); c.dataset.s = i; c.setAttribute('aria-label', `${nm} ${i + 1}`);
      c.onclick = () => { S.pat[k][i] = S.pat[k][i] ? 0 : 1; changed(); c.className = 'cell' + (i % 4 === 0 ? ' beat' : '') + (S.pat[k][i] ? ' on' : ''); if (!playing) previewRow(k, i); };
      if (S.mute[k]) c.style.opacity = 0.35;
      g.appendChild(c);
    }
  }
}
function renderSong() {
  const el = $('song'); el.innerHTML = '';
  el.style.display = S.playmode === 'song' ? 'flex' : 'none';
  SONG.forEach((s) => { const d = document.createElement('div'); d.className = 'sec'; d.style.setProperty('--n', s.bars); d.textContent = `${t('secs')[s.id]} · ${s.bars}`; el.appendChild(d); });
}
async function previewRow(k, i) {
  await ensureAudio(); const kit = await loadKit(S.kit); const tm = ctx.currentTime + 0.02;
  const solo = { ...S, mute: {}, pat: {} }; for (const r of ROWS) solo.pat[r] = Array(16).fill(0); solo.pat[k][i] = 1;
  scheduleStep(ctx, master, solo, kit, 0, i, tm, null);
}
let editSent = false;
function changed() { save(); if (!editSent) { editSent = true; track('first_edit', { genre: S.genre }); } }
function load(st) {
  S = st; S.mute = S.mute || {}; S.playmode = S.playmode || 'loop'; renderResume(); renderStudio(); save();
}
async function make(seedBump) {
  const text = $('q').value.trim() || t('examples')[0];
  if (!$('q').value.trim()) $('q').value = text;
  const seed = seedBump && S ? S.seed + 1 : Math.floor(Math.random() * 1e9);
  const wasPlaying = playing; if (playing) stop();
  $('loading').textContent = t('loading');
  await ensureAudio();
  const st = generate(text, seed); st.playmode = S ? S.playmode : 'loop';
  await loadKit(st.kit); $('loading').textContent = '';
  load(st); track('generate', { genre: st.genre, guessed: st.guessed, again: !!seedBump });
  await start();
  if (!wasPlaying && !seedBump) $('studio').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- wiring ----------
$('form').onsubmit = (e) => { e.preventDefault(); make(); };
$('lang').onclick = () => { lang = lang === 'en' ? 'ko' : 'en'; try { localStorage.setItem('ybk-lang', lang); } catch {} applyLang(); };
$('play').onclick = () => (playing ? stop() : start());
$('bpm').oninput = (e) => { S.bpm = Number(e.target.value); $('bpmv').textContent = S.bpm; changed(); };
$('swing').oninput = (e) => { S.swing = Number(e.target.value); $('swingv').textContent = S.swing + '%'; changed(); };
$('kit').onchange = async (e) => { S.kit = e.target.value; await ensureAudio(); await loadKit(S.kit); changed(); };
$('root').onchange = (e) => { S.root = Number(e.target.value); changed(); renderStudio(); };
$('mode').onchange = (e) => { S.minor = e.target.value === 'minor'; changed(); renderStudio(); };
$('vinyl').onchange = (e) => { S.vinyl = e.target.checked; changed(); if (playing) updateVinyl(); };
$('playmode').onchange = (e) => { S.playmode = e.target.value; save(); renderSong(); if (playing) { stop(); start(); } };
$('again').onclick = () => make(true);
$('share').onclick = async () => {
  const url = location.origin + location.pathname + '#b=' + encodeState(S);
  try { await navigator.clipboard.writeText(url); toast(t('copied')); } catch { prompt('', url); }
  track('share', { genre: S.genre });
};
$('expLoop').onclick = () => doExport(false);
$('expSong').onclick = () => doExport(true);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && S && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); playing ? stop() : start(); }
});

applyLang();
(function boot() {
  const m = location.hash.match(/#b=([\w-]+)/);
  if (m) { const st = decodeState(m[1]); if (st) { $('q').value = st.prompt || ''; load(st); track('open_shared'); } }
})();
// Exposed for automated checks.
window.__ybk = { generate, parsePrompt, render, get state() { return S; } };
