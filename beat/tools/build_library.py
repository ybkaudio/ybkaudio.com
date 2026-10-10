"""Builds samples/lib/<type>.mp3 sprites + library.json.
Each sprite holds, per instrument type:
  - YBK genre kit variants (v1/v2, A/B) for lofi/boombap/trap/house/techno, flagged k=1
  - YBK Drums library picks across all genres, plus extra picks for the five kit genres
Each sample sits in a fixed-length slot; the page finds the onset inside each slot.
Also writes the kit default one-shots to samples/<genre>/<type>.wav."""
import json, os, subprocess, zipfile, collections, numpy as np, sys
SRC = '/mnt/project-files/beatmaker/ybk-drums'
KITS = '/mnt/project-files/beatmaker'
OUT = sys.argv[1]
SR = 44100
MANS = ['ybk_drums_manifest.json', 'ybk_drums_gapfill_manifest.json', 'ybk_drums_round3_manifest.json', 'ybk_drums_round4_manifest.json', 'ybk_drums_round5_manifest.json']
ZIPS = ['YBK_Drums.zip', 'YBK_Drums_Plus.zip', 'YBK_Drums_Plus2.zip', 'YBK_Drums_Plus3.zip', 'YBK_Drums_Plus4.zip']
GENRE_KITS = {'lofi': 'LoFi', 'boombap': 'BoomBap', 'trap': 'Trap', 'house': 'House', 'techno': 'Techno'}
# type: (library categories, kit voice names, picks per genre per category, slot seconds)
TYPES = {
  'kick': (['kick'], ['Kick'], 4, 0.9), 'snare': (['snare'], ['Snare'], 5, 0.9), 'clap': (['clap', 'snap'], ['Clap', 'Snap'], 6, 0.9),
  'hat': (['hat_closed'], ['HiHat_Closed'], 4, 0.6), 'ohat': (['hat_open'], ['HiHat_Open'], 6, 1.4),
  'perc': (['perc'], ['Clave', 'Woodblock', 'Perc_Metal', 'Triangle'], 3, 0.9), 'rim': (['rim'], ['Rim'], 4, 0.6),
  'shaker': (['shaker'], ['Shaker'], 4, 0.6), 'conga': (['handdrum'], ['Conga', 'Bongo'], 4, 0.9),
  'cowbell': (['cowbell'], ['Cowbell'], 4, 0.9), 'tambourine': (['tambourine'], ['Tambourine'], 4, 0.9),
  'tom': (['tom'], ['Tom'], 3, 1.0), 'crash': (['crash'], ['Crash'], 4, 2.0), 'ride': (['cymbal'], ['Ride'], 3, 1.6),
}
DEFAULT_VOICE = {'perc': {'techno': 'Perc_Metal'}, 'clap': {}, 'conga': {}}
man = []
for m in MANS: man += json.load(open(os.path.join(SRC, m)))
where = {}
for z in [zipfile.ZipFile(os.path.join(SRC, z)) for z in ZIPS]:
  for n in z.namelist(): where[os.path.basename(n)] = (z, n)
def decode(data):
  p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', 'pipe:0', '-ac', '1', '-ar', str(SR), '-f', 'f32le', 'pipe:1'], input=data, capture_output=True, check=True)
  return np.frombuffer(p.stdout, dtype=np.float32).copy()
def kitfile(g, voice, var, ver):
  d = f'{KITS}/genre-kits{"-v2" if ver == 2 else ""}/YBK {GENRE_KITS[g]} Kit{" v2" if ver == 2 else ""}'
  if not os.path.isdir(d): return None
  for f in os.listdir(d):
    if f'_{voice}_{var}' in f and f.endswith('.wav'): return os.path.join(d, f)
  return None
os.makedirs(os.path.join(OUT, 'lib'), exist_ok=True)
lib = {}
for typ, (cats, voices, k, slot) in TYPES.items():
  entries = []  # (item dict, audio bytes getter)
  for g in GENRE_KITS:
    n = 0
    for voice in voices:
      for ver in (2, 1):
        for var in ('A', 'B'):
          f = kitfile(g, voice, var, ver)
          if f: n += 1; entries.append(({'g': g, 'c': voice.lower(), 'id': f'kit_{g}_{voice}_{var}{ver}', 'k': 1}, (lambda f=f: open(f, 'rb').read())))
  for x in man:  # every YBK Drums sample of this type
    if x['category'] in cats and x['file'] in where:
      z, nme = where[x['file']]
      entries.append(({'g': x['genre'], 'c': x['category'], 'id': x['file'][4:-4]}, (lambda z=z, nme=nme: z.read(nme))))
  # One sprite per genre so the page only downloads what it needs. Variable-length slots: o = start, d = length (s).
  bygenre = collections.defaultdict(list)
  for e in entries: bygenre[e[0]['g']].append(e)
  os.makedirs(os.path.join(OUT, 'lib', typ), exist_ok=True)
  items = []; maxL = int(slot * SR); gap = int(0.08 * SR)
  for g, ents in sorted(bygenre.items()):
    parts = []; pos = 0
    for it, get in ents:
      a = decode(get())[:maxL]
      if len(a) < 64: continue
      peak = np.max(np.abs(a)) or 1; a = a / peak * 0.9
      fade = min(len(a), int(0.03 * SR)); a[-fade:] *= np.linspace(1, 0, fade)
      it = dict(it, o=round(pos / SR, 4), d=round(len(a) / SR, 4)); items.append(it)
      parts += [a, np.zeros(gap, np.float32)]; pos += len(a) + gap
    raw = os.path.join(OUT, 'lib', typ, g + '.raw'); np.concatenate(parts).astype(np.float32).tofile(raw)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', raw, '-b:a', '64k', os.path.join(OUT, 'lib', typ, g + '.mp3')], check=True)
    os.remove(raw)
  lib[typ] = {'dir': f'samples/lib/{typ}/', 'items': items}
  print(typ, len(items), sum(1 for x in items if x.get('k')), len(bygenre), 'genres', flush=True)
  # kit defaults (v2 A) for fast first sound
  for g in GENRE_KITS:
    voice = DEFAULT_VOICE.get(typ, {}).get(g, voices[0])
    f = kitfile(g, voice, 'A', 2) or kitfile(g, voices[0], 'A', 2) or kitfile(g, voices[1] if len(voices) > 1 else voices[0], 'A', 2)
    dst = os.path.join(OUT, g, typ + '.wav')
    if f and not os.path.exists(dst):
      Lk = {'crash': 2.0, 'ride': 1.6, 'ohat': 1.0}.get(typ, 0.9)
      subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f, '-t', str(Lk), '-af', f'afade=t=out:st={Lk-0.08}:d=0.08', '-ac', '1', '-ar', '44100', '-sample_fmt', 's16', dst], check=True)
# 808s: one wav each, with measured root note.
bass = []
for name, path in [('Trap 808 A', 'genre-kits-v2/YBK Trap Kit v2/Trap_02_808_A_v2.wav'), ('Trap 808 B', 'genre-kits-v2/YBK Trap Kit v2/Trap_02_808_B_v2.wav'),
                   ('Classic 808 A', 'genre-kits/YBK Trap Kit/Trap_02_808_A.wav'), ('Classic 808 B', 'genre-kits/YBK Trap Kit/Trap_02_808_B.wav'),
                   ('Core 808 Bass', 'YBK Core Kit/19_Bass_808_C.wav'), ('Core 808 Kick', 'YBK Core Kit/02_Kick_808.wav')]:
  a = decode(open(os.path.join(KITS, path), 'rb').read())
  seg = a[int(0.12 * SR):int(0.62 * SR)]; seg = seg * np.hanning(len(seg))
  N = 1 << 18; S = np.abs(np.fft.rfft(seg, N)); f = np.fft.rfftfreq(N, 1 / SR); msk = (f > 25) & (f < 200)
  f0 = float(f[msk][S[msk].argmax()]); midi = 69 + 12 * np.log2(f0 / 440)
  fn = 'b%d.wav' % len(bass)
  subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(KITS, path), '-t', '1.8', '-af', 'afade=t=out:st=1.6:d=0.2', '-ac', '1', '-ar', '44100', '-sample_fmt', 's16', os.path.join(OUT, 'lib', fn)], check=True)
  bass.append({'id': name, 'file': f'samples/lib/{fn}', 'root': round(midi, 2)})
lib['bass'] = {'items': bass}
json.dump(lib, open(os.path.join(OUT, 'library.json'), 'w'), separators=(',', ':'))
