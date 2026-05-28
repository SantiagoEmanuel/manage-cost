import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../src/db/migrations');
const dest = resolve(__dirname, '../dist/db/migrations');

if (!existsSync(src)) {
  console.error(`No migrations folder found at ${src}`);
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied migrations -> ${dest}`);
