import { mkdir, writeFile } from 'node:fs/promises';
try {
  process.loadEnvFile?.();
} catch {
  // .env is optional; continue if not present
}

const outputPath = new URL('../public/runtime-config.js', import.meta.url);
const url = process.env.SUPABASE_URL ?? '';
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? '';

await mkdir(new URL('../public/', import.meta.url), { recursive: true });
await writeFile(
  outputPath,
  `globalThis.__PORTFOLIO_SUPABASE_CONFIG__ = ${JSON.stringify({ url, publishableKey })};\n`,
  'utf8',
);
