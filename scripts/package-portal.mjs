import { createWriteStream } from 'fs';
import { mkdir, readdir, stat, cp } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const packagesDir = path.join(root, 'packages');

const target = process.argv[2] || 'itch';

async function ensureDist() {
  try {
    await stat(dist);
  } catch {
    console.error('Run npm run build:portal first');
    process.exit(1);
  }
}

async function zipFolder(sourceDir, outPath) {
  await mkdir(packagesDir, { recursive: true });
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function main() {
  await ensureDist();
  await mkdir(packagesDir, { recursive: true });

  if (target === 'gamepix' || target === 'itch') {
    const name = target === 'gamepix' ? 'sontinhgame-gamepix.zip' : 'sontinhgame-itch.zip';
    const out = path.join(packagesDir, name);
    await zipFolder(dist, out);
    console.log(`Created ${out}`);
  } else {
    const outDir = path.join(packagesDir, `${target}-upload`);
    await cp(dist, outDir, { recursive: true });
    console.log(`Copied to ${outDir}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
