#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportDirectory = path.join(rootDirectory, 'quality-gate');
const previewUrl = process.env.QUALITY_GATE_URL || 'http://127.0.0.1:4173';

const thresholds = {
  performance: 0.7,
  accessibility: 0.9,
  'best-practices': 0.85,
  seo: 0.9,
};

// Core Web Vitals, asserted directly. Category scores alone hide a slow hero.
const vitals = {
  'largest-contentful-paint': { maximum: 2500, label: 'LCP', unit: 'ms' },
  'cumulative-layout-shift': { maximum: 0.1, label: 'CLS', unit: '' },
};

// Mobile is the primary target: these visitors arrive from a phone.
const profiles = [
  { key: 'mobile', formFactor: 'mobile', screenEmulation: undefined },
  {
    key: 'desktop',
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
  },
];

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDirectory,
      env: process.env,
      stdio: options.stdio ?? 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function waitForServer(url, attempts = 40) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        return;
      }
    } catch {
      // server not ready
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Preview server did not become ready at ${url}`);
}

async function main() {
  await runCommand('yarn', ['build']);
  await mkdir(reportDirectory, { recursive: true });

  const preview = spawn('yarn', ['preview', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: rootDirectory,
    env: process.env,
    stdio: 'ignore',
  });

  let chrome;

  try {
    await waitForServer(previewUrl);

    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    });

    const runs = [];

    for (const profile of profiles) {
      const result = await lighthouse(previewUrl, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: Object.keys(thresholds),
        formFactor: profile.formFactor,
        screenEmulation: profile.screenEmulation,
      });

      const categories = result?.lhr?.categories ?? {};
      const audits = result?.lhr?.audits ?? {};

      const scores = Object.fromEntries(
        Object.keys(thresholds).map((key) => [key, categories[key]?.score ?? 0]),
      );

      const measured = Object.fromEntries(
        Object.keys(vitals).map((key) => [key, audits[key]?.numericValue ?? Number.POSITIVE_INFINITY]),
      );

      const profileFailures = [
        ...Object.entries(thresholds)
          .filter(([key, minimum]) => (scores[key] ?? 0) < minimum)
          .map(([key, minimum]) => `${profile.key} ${key}: ${(scores[key] ?? 0).toFixed(2)} < ${minimum.toFixed(2)}`),
        ...Object.entries(vitals)
          .filter(([key, { maximum }]) => (measured[key] ?? Number.POSITIVE_INFINITY) > maximum)
          .map(([key, { maximum, label, unit }]) => {
            const value = measured[key];
            const shown = Number.isFinite(value) ? value.toFixed(unit ? 0 : 3) : 'not measured';
            return `${profile.key} ${label}: ${shown}${unit} > ${maximum}${unit}`;
          }),
      ];

      runs.push({ profile, result, scores, measured, failures: profileFailures });
    }

    const failures = runs.flatMap((run) => run.failures);
    const result = runs.find((run) => run.profile.key === 'mobile')?.result ?? runs[0].result;
    const scores = Object.fromEntries(
      runs.map((run) => [run.profile.key, run.scores]),
    );

    const decision = failures.length === 0 ? 'SHIP' : 'REDO';
    const markdown = [
      '# Quality gate',
      '',
      `- Decision: **${decision}**`,
      `- URL: ${previewUrl}`,
      `- Generated: ${new Date().toISOString()}`,
      '',
      '## Lighthouse scores',
      '',
      ...runs.flatMap((run) => [
        `### ${run.profile.key}`,
        '',
        ...Object.entries(run.scores).map(
          ([key, score]) => `- ${key}: ${(score ?? 0).toFixed(2)} (min ${thresholds[key].toFixed(2)})`,
        ),
        ...Object.entries(vitals).map(([key, { maximum, label, unit }]) => {
          const value = run.measured[key];
          const shown = Number.isFinite(value) ? value.toFixed(unit ? 0 : 3) : 'not measured';
          return `- ${label}: ${shown}${unit} (max ${maximum}${unit})`;
        }),
        '',
      ]),
      failures.length > 0 ? '## Failures' : '## Failures',
      '',
      failures.length > 0 ? failures.map((item) => `- ${item}`).join('\n') : '- None',
      '',
      '## Visual review (required before outreach)',
      '',
      '- [ ] Desktop screenshot reviewed (`quality-gate/desktop.png`)',
      '- [ ] Mobile screenshot reviewed (`quality-gate/mobile.png`)',
      '- [ ] Site looks stunning with clear WOW (3D + scroll storytelling)',
      '- [ ] Site does not look AI-generated',
      '- [ ] Demo preview banner and attribution are visible',
      '- [ ] Third-party imagery licence-cleared and credited in `CREDITS.md` (pngimg.com is CC BY-NC 4.0)',
      '- [ ] Primary CTA works on a real mechanism and is reachable in one thumb movement at every scroll position',
      '- [ ] No horizontal overflow at 360px; tap targets at least 44x44px',
      '- [ ] Design tokens authored — no placeholder ramp, no unset font family',
      '- [ ] JSON-LD, robots.txt, sitemap.xml, favicon, and og-image are real, not template stubs',
      '',
      `Final gate: **${decision}**. Outreach is forbidden until this file says SHIP and visual checks are complete.`,
      '',
    ].join('\n');

    await writeFile(path.join(reportDirectory, 'lighthouse.json'), JSON.stringify(result.lhr, null, 2));
    await writeFile(path.join(reportDirectory, 'report.md'), markdown);

    console.log(`Quality gate decision: ${decision}`);
    console.log(`Scores: ${JSON.stringify(scores)}`);
    if (failures.length > 0) {
      console.log(`Failures:\n${failures.map((item) => `  - ${item}`).join('\n')}`);
    }

    if (decision !== 'SHIP') {
      process.exitCode = 1;
    }
  } finally {
    if (chrome) {
      await chrome.kill();
    }

    preview.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
