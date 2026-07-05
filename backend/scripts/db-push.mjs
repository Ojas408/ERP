import { execSync } from 'node:child_process';

const MAX_TRIES = 30;
const DELAY_MS = 3000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      console.log(`Applying database schema (attempt ${attempt}/${MAX_TRIES})...`);
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('Database schema applied.');
      return;
    } catch {
      if (attempt === MAX_TRIES) {
        console.error('Database schema push failed after all retries.');
        process.exit(1);
      }
      console.log(`Database not ready, retrying in ${DELAY_MS / 1000}s...`);
      await sleep(DELAY_MS);
    }
  }
}

main();
