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
  'AGENTS.md',
  'CLAUDE.md',
  'template/AGENTS.md',
  'template/CLAUDE.md',
  'template/demo-meta.json',
  'template/scripts/quality-gate.mjs',
  'template/scripts/demo-takedown.mjs',
  'template/_github/workflows/release-website.yml',
  'template/_github/workflows/demo-takedown.yml',
  'template/src/App.tsx',
  'template/src/shared/components/JmrSquaredAttribution.tsx',
  'template/src/shared/components/DemoPreviewBanner.tsx',
  'template/src/shared/config/attribution.ts',
  'template/src/shared/config/demo-preview.ts',
  'template/src/features/site-template/components/HeroCanvas.tsx',
  'template/_cursor/rules/jmr-squared-attribution.mdc',
  'template/_cursor/rules/quality-gate.mdc',
  'template/_cursor/rules/demo-preview-and-takedown.mdc',
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

const claudeRoot = await readFile(path.join(rootDirectory, 'CLAUDE.md'), 'utf8');
const claudeTemplate = await readFile(path.join(rootDirectory, 'template/CLAUDE.md'), 'utf8');

if (!claudeRoot.includes('@AGENTS.md') || !claudeTemplate.includes('@AGENTS.md')) {
  throw new Error('CLAUDE.md files must only reference @AGENTS.md');
}

const attributionComponent = await readFile(
  path.join(rootDirectory, 'template/src/shared/components/JmrSquaredAttribution.tsx'),
  'utf8',
);
const attributionConfig = await readFile(
  path.join(rootDirectory, 'template/src/shared/config/attribution.ts'),
  'utf8',
);
const appEntry = await readFile(path.join(rootDirectory, 'template/src/App.tsx'), 'utf8');
const templatePackage = await readFile(path.join(rootDirectory, 'template/package.json'), 'utf8');

const requiredSnippets = [
  {
    label: 'studio URL in attribution config',
    haystack: attributionConfig,
    needle: 'https://tech.jmrsquared.com/',
  },
  {
    label: 'contact email in attribution config',
    haystack: attributionConfig,
    needle: 'tech@jmrsquared.com',
  },
  {
    label: 'studio URL in attribution component',
    haystack: attributionComponent,
    needle: 'jmrSquaredAttribution.studioUrl',
  },
  {
    label: 'contact mailto in attribution component',
    haystack: attributionComponent,
    needle: 'jmrSquaredAttribution.contactMailto',
  },
  {
    label: 'JmrSquaredAttribution mounted in App',
    haystack: appEntry,
    needle: '<JmrSquaredAttribution',
  },
  {
    label: 'DemoPreviewBanner mounted in App',
    haystack: appEntry,
    needle: '<DemoPreviewBanner',
  },
  {
    label: 'three dependency in template package',
    haystack: templatePackage,
    needle: '"three"',
  },
  {
    label: 'gsap dependency in template package',
    haystack: templatePackage,
    needle: '"gsap"',
  },
  {
    label: '@react-three/fiber dependency in template package',
    haystack: templatePackage,
    needle: '"@react-three/fiber"',
  },
  {
    label: 'quality:gate script in template package',
    haystack: templatePackage,
    needle: '"quality:gate"',
  },
];

const snippetFailures = requiredSnippets
  .filter((snippet) => !snippet.haystack.includes(snippet.needle))
  .map((snippet) => snippet.label);

if (snippetFailures.length > 0) {
  throw new Error(`Template requirements missing: ${snippetFailures.join(', ')}`);
}

console.log(`Validated ${packageJson.name}@${packageJson.version}`);
