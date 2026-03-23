import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDirectory = process.cwd();
const packageJsonPath = path.join(rootDirectory, 'package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

const binEntries =
  typeof packageJson.bin === 'string'
    ? [packageJson.bin]
    : Object.values(packageJson.bin ?? {});

const requiredFiles = [
  ...binEntries,
  ...((packageJson.files ?? []).filter((entry) => entry !== 'README.md')),
  'README.md',
  'template/_github/workflows/release-website.yml',
];

const missingEntries = [];

for (const entry of requiredFiles) {
  if (!entry) {
    missingEntries.push('(missing package.json field)');
    continue;
  }

  try {
    await access(path.join(rootDirectory, entry));
  } catch {
    missingEntries.push(entry);
  }
}

if (packageJson.name !== 'create-jmrsquared-website-template') {
  throw new Error(`Unexpected package name: ${packageJson.name}`);
}

if (!packageJson.version) {
  throw new Error('package.json must define a version.');
}

if (packageJson.private) {
  throw new Error('The root package must not be marked private.');
}

if (binEntries.length === 0) {
  throw new Error('package.json must define at least one bin entry.');
}

if (missingEntries.length > 0) {
  throw new Error(`Missing publishable entries: ${missingEntries.join(', ')}`);
}

console.log(`Validated ${packageJson.name}@${packageJson.version}`);
