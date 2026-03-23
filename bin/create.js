#!/usr/bin/env node

import { runScaffolder } from '../lib/scaffold.js';

runScaffolder().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nScaffolding failed: ${message}`);
  process.exitCode = 1;
});
