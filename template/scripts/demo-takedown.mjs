#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metaPath = path.join(rootDirectory, 'demo-meta.json');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDirectory,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${command} ${args.join(' ')} failed${details ? `: ${details}` : ''}`);
  }

  return result.stdout.trim();
}

function commandExists(command) {
  return spawnSync('sh', ['-lc', `command -v ${command} >/dev/null 2>&1`]).status === 0;
}

async function main() {
  const meta = JSON.parse(await readFile(metaPath, 'utf8'));
  const now = new Date();
  const takedownAt = new Date(meta.takedownAt);

  if (Number.isNaN(takedownAt.getTime())) {
    throw new Error('demo-meta.json is missing a valid takedownAt date.');
  }

  if (meta.status === 'taken-down') {
    console.log('Demo already marked taken-down. Nothing to do.');
    return;
  }

  if (now < takedownAt) {
    console.log(`Takedown scheduled for ${meta.takedownAt}. Skipping.`);
    return;
  }

  const provider = String(meta.deployProvider || '').toLowerCase();
  const projectName = meta.deployProjectName;

  if (provider === 'cloudflare') {
    if (!commandExists('npx')) {
      throw new Error('npx is required to take down Cloudflare Pages demos.');
    }

    run('npx', ['--yes', 'wrangler', 'pages', 'project', 'delete', projectName, '--yes']);
  } else if (provider === 'firebase') {
    if (!commandExists('firebase')) {
      throw new Error('firebase CLI is required to take down Firebase demos.');
    }

    run('firebase', ['hosting:disable', '--project', projectName, '-f']);
  } else {
    throw new Error(`Unsupported deploy provider in demo-meta.json: ${provider || '(empty)'}`);
  }

  const nextMeta = {
    ...meta,
    status: 'taken-down',
    takenDownAt: now.toISOString(),
  };

  await writeFile(metaPath, `${JSON.stringify(nextMeta, null, 2)}\n`, 'utf8');

  if (commandExists('gh') && process.env.GH_TOKEN) {
    try {
      run('gh', [
        'issue',
        'create',
        '--title',
        `Demo taken down: ${meta.appName}`,
        '--body',
        [
          `Automated takedown completed for **${meta.appName}**.`,
          '',
          `- Site URL: ${meta.siteUrl}`,
          `- Provider: ${meta.deployProvider}`,
          `- Project: ${meta.deployProjectName}`,
          `- Scheduled takedown: ${meta.takedownAt}`,
          `- Completed: ${nextMeta.takenDownAt}`,
        ].join('\n'),
      ]);
    } catch (error) {
      console.warn(error instanceof Error ? error.message : error);
    }
  }

  console.log(`Demo taken down for ${meta.appName}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
