#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const updateScript = resolve(__dirname, 'update-gkm-and-beads.sh');

if (!existsSync(updateScript)) {
  console.error(`update-gkm-and-beads.sh not found at ${updateScript}`);
  process.exit(1);
}

const child = spawn('bash', [updateScript, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(`Failed to spawn update script: ${error.message}`);
  process.exit(1);
});
