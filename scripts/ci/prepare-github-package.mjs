import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDirectory = process.cwd();
const packageJsonPath = path.join(rootDirectory, 'package.json');
const outputDirectory = path.join(rootDirectory, '.publish', 'github-package');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

const repositoryOwner = (process.env.GITHUB_REPOSITORY_OWNER || '').trim().toLowerCase();
const repositorySlug = (process.env.GITHUB_REPOSITORY || '').trim();
const serverUrl = (process.env.GITHUB_SERVER_URL || 'https://github.com').replace(/\/$/, '');

if (!repositoryOwner) {
  throw new Error('GITHUB_REPOSITORY_OWNER is required to prepare the GitHub Packages bundle.');
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const entry of ['bin', 'lib', 'scripts', 'template']) {
  await cp(path.join(rootDirectory, entry), path.join(outputDirectory, entry), { recursive: true });
}

await cp(path.join(rootDirectory, 'README.md'), path.join(outputDirectory, 'README.md'));

const githubPackageJson = {
  ...packageJson,
  name: `@${repositoryOwner}/${packageJson.name}`,
  publishConfig: {
    registry: 'https://npm.pkg.github.com',
  },
};

if (repositorySlug) {
  const repositoryUrl = `${serverUrl}/${repositorySlug}.git`;
  const homepageUrl = `${serverUrl}/${repositorySlug}`;

  githubPackageJson.repository = {
    type: 'git',
    url: `git+${repositoryUrl}`,
  };
  githubPackageJson.homepage = homepageUrl;
  githubPackageJson.bugs = {
    url: `${homepageUrl}/issues`,
  };
}

await writeFile(
  path.join(outputDirectory, 'package.json'),
  `${JSON.stringify(githubPackageJson, null, 2)}\n`,
  'utf8',
);

console.log(`Prepared ${githubPackageJson.name}@${githubPackageJson.version} in ${outputDirectory}`);
