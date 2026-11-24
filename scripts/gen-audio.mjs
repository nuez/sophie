// Generates public/audio/<id>.mp3 for every phrase with macOS `say` (voice Mónica, es_ES) + ffmpeg.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const phrases = JSON.parse(readFileSync('src/audio/phrases.json', 'utf8'));
const outDir = 'public/audio';
mkdirSync(outDir, { recursive: true });
const manifestPath = join(outDir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const tmp = join(tmpdir(), 'mates-say.aiff');
let made = 0;
for (const [id, text] of Object.entries(phrases)) {
  const out = join(outDir, `${id}.mp3`);
  if (manifest[id] === text && existsSync(out)) continue;
  execFileSync('say', ['-v', 'Mónica', '-r', '165', '-o', tmp, text]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', tmp, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse', '-ac', '1', '-ar', '22050', '-b:a', '48k', out]);
  manifest[id] = text;
  made++;
}
for (const id of Object.keys(manifest)) if (!(id in phrases)) { rmSync(join(outDir, `${id}.mp3`), { force: true }); delete manifest[id]; }
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
console.log(`audio: ${made} generated, ${Object.keys(phrases).length} total`);
