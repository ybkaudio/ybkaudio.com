"""Builds samples/lib/<row>.mp3 sprites + library.json from the YBK Drums library zips.
Each sample sits in a fixed-length slot; the page finds the onset inside each slot."""
import json, os, subprocess, zipfile, collections, numpy as np, sys, re
SRC = '/mnt/project-files/beatmaker/ybk-drums'
OUT = sys.argv[1]
SR = 44100
MANS = ['ybk_drums_manifest.json', 'ybk_drums_gapfill_manifest.json', 'ybk_drums_round3_manifest.json', 'ybk_drums_round4_manifest.json', 'ybk_drums_round5_manifest.json']
ZIPS = ['YBK_Drums.zip', 'YBK_Drums_Plus.zip', 'YBK_Drums_Plus2.zip', 'YBK_Drums_Plus3.zip', 'YBK_Drums_Plus4.zip']
ROWS = {  # row: (categories, per genre per category, slot seconds)
  'kick': (['kick'], 4, 0.9), 'snare': (['snare'], 5, 0.9), 'clap': (['clap', 'snap'], 6, 0.9),
  'hat': (['hat_closed'], 4, 0.6), 'ohat': (['hat_open'], 6, 1.4),
  'perc': (['rim', 'shaker', 'perc', 'handdrum', 'cowbell', 'tambourine', 'tom'], 4, 0.9),
}
man = []
for m in MANS: man += json.load(open(os.path.join(SRC, m)))
where = {}
zs = [zipfile.ZipFile(os.path.join(SRC, z)) for z in ZIPS]
for z in zs:
  for n in z.namelist(): where[os.path.basename(n)] = (z, n)
def decode(data):
  p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', 'pipe:0', '-ac', '1', '-ar', str(SR), '-f', 'f32le', 'pipe:1'], input=data, capture_output=True, check=True)
  return np.frombuffer(p.stdout, dtype=np.float32)
os.makedirs(os.path.join(OUT, 'lib'), exist_ok=True)
lib = {}
for row, (cats, k, slot) in ROWS.items():
  groups = collections.defaultdict(list)
  for x in man:
    if x['category'] in cats and x['file'] in where: groups[(x['genre'], x['category'])].append(x)
  picks = []
  for key in sorted(groups):
    g = sorted(groups[key], key=lambda x: x.get('dist_centre', 0))
    step = max(1, len(g) // k)
    picks += g[::step][:k]
  L = int(slot * SR); buf = np.zeros(L * len(picks), np.float32); items = []
  for i, x in enumerate(picks):
    z, n = where[x['file']]; a = decode(z.read(n))[:L - 400]
    peak = np.max(np.abs(a)) or 1; a = a / peak * 0.9
    fade = min(len(a), int(0.03 * SR)); a[-fade:] *= np.linspace(1, 0, fade)
    buf[i * L:i * L + len(a)] = a
    m = re.match(r'YBK_[a-z_]+?_([a-z]+)_(\w+)\.wav', x['file'])
    items.append({'g': x['genre'], 'c': x['category'], 'id': x['file'][4:-4]})
  wav = os.path.join(OUT, 'lib', row + '.raw')
  buf.tofile(wav)
  subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', wav, '-b:a', '96k', os.path.join(OUT, 'lib', row + '.mp3')], check=True)
  os.remove(wav)
  lib[row] = {'file': f'samples/lib/{row}.mp3', 'slot': slot, 'items': items}
  print(row, len(items), os.path.getsize(os.path.join(OUT, 'lib', row + '.mp3')) // 1024, 'KB')
# 808s: one wav each, with measured root note.
bass = []
K = '/mnt/project-files/beatmaker'
for name, path in [('Trap 808 A', 'genre-kits-v2/YBK Trap Kit v2/Trap_02_808_A_v2.wav'), ('Trap 808 B', 'genre-kits-v2/YBK Trap Kit v2/Trap_02_808_B_v2.wav'),
                   ('Classic 808 A', 'genre-kits/YBK Trap Kit/Trap_02_808_A.wav'), ('Classic 808 B', 'genre-kits/YBK Trap Kit/Trap_02_808_B.wav'),
                   ('Core 808 Bass', 'YBK Core Kit/19_Bass_808_C.wav'), ('Core 808 Kick', 'YBK Core Kit/02_Kick_808.wav')]:
  a = decode(open(os.path.join(K, path), 'rb').read())
  seg = a[int(0.12 * SR):int(0.62 * SR)]; seg = seg * np.hanning(len(seg))
  N = 1 << 18; S = np.abs(np.fft.rfft(seg, N)); f = np.fft.rfftfreq(N, 1 / SR); msk = (f > 25) & (f < 200)
  f0 = float(f[msk][S[msk].argmax()]); midi = 69 + 12 * np.log2(f0 / 440)
  fn = 'b%d.wav' % len(bass)
  subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(K, path), '-t', '1.8', '-af', 'afade=t=out:st=1.6:d=0.2', '-ac', '1', '-ar', '44100', '-sample_fmt', 's16', os.path.join(OUT, 'lib', fn)], check=True)
  bass.append({'id': name, 'file': f'samples/lib/{fn}', 'root': round(midi, 2)})
  print(name, round(f0, 1), round(midi, 2))
lib['bass'] = {'items': bass}
json.dump(lib, open(os.path.join(OUT, 'library.json'), 'w'), separators=(',', ':'))
