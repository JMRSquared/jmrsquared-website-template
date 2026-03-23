import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const TEMPLATE_DIR = fileURLToPath(new URL('../template', import.meta.url));
const FIREBASE_CONFIG_TEMPLATE = `{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
`;

const FIREBASERC_TEMPLATE = `{
  "projects": {
    "default": "__FIREBASE_PROJECT_ID__"
  }
}
`;

function replaceTemplateTokens(content, replacements) {
  return Object.entries(replacements).reduce(
    (currentContent, [token, value]) => currentContent.replaceAll(token, value),
    content,
  );
}

function runCommand(command, args, options = {}) {
  const { cwd = process.cwd(), capture = false, envOverrides = {} } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...envOverrides },
      stdio: capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    });

    let stdout = '';
    let stderr = '';

    if (capture && child.stdout) {
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        process.stdout.write(text);
      });
    }

    if (capture && child.stderr) {
      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        process.stderr.write(text);
      });
    }

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });
  });
}

function captureCommand(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

function commandExists(command) {
  return spawnSync('sh', ['-lc', `command -v ${command} >/dev/null 2>&1`], {
    stdio: 'ignore',
  }).status === 0;
}

async function installProjectDependencies(targetDirectory) {
  const packageJsonPath = path.join(targetDirectory, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const packageManager = packageJson.packageManager || '';
  const isModernYarn = /^yarn@([2-9]|\d{2,})\./.test(packageManager);
  const installOptions = isModernYarn
    ? { cwd: targetDirectory, envOverrides: { YARN_ENABLE_IMMUTABLE_INSTALLS: 'false' } }
    : { cwd: targetDirectory };

  if (packageManager.startsWith('yarn@')) {
    if (commandExists('corepack')) {
      await runCommand('corepack', ['yarn', 'install'], installOptions);
      return;
    }

    const installedYarnVersion = captureCommand('yarn', ['--version'], targetDirectory);

    if (installedYarnVersion && packageManager === `yarn@${installedYarnVersion}`) {
      await runCommand('yarn', ['install'], installOptions);
      return;
    }

    throw new Error(
      'Corepack is required to install dependencies for the generated project. Run `corepack enable` and rerun the scaffolder.',
    );
  }

  await runCommand('yarn', ['install'], { cwd: targetDirectory });
}

function commandSucceeds(command, args, cwd = process.cwd()) {
  return spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: 'ignore',
  }).status === 0;
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureEmptyDestination(targetDirectory) {
  if (!(await pathExists(targetDirectory))) {
    await mkdir(targetDirectory, { recursive: true });
    return;
  }

  const stats = await stat(targetDirectory);

  if (!stats.isDirectory()) {
    throw new Error(`Destination exists and is not a directory: ${targetDirectory}`);
  }

  const entries = await readdir(targetDirectory);

  if (entries.length > 0) {
    throw new Error(`Destination directory is not empty: ${targetDirectory}`);
  }
}

async function copyTemplateDirectory(sourceDirectory, targetDirectory, replacements) {
  await mkdir(targetDirectory, { recursive: true });

  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const targetName = entry.name.startsWith('_') ? `.${entry.name.slice(1)}` : entry.name;
    const sourcePath = path.join(sourceDirectory, entry.name);
    const targetPath = path.join(targetDirectory, targetName);

    if (entry.isDirectory()) {
      await copyTemplateDirectory(sourcePath, targetPath, replacements);
      continue;
    }

    const fileContents = await readFile(sourcePath, 'utf8');
    await writeFile(targetPath, replaceTemplateTokens(fileContents, replacements), 'utf8');
  }
}

function sanitizePackageName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_./]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '') || 'my-website';
}

function toDisplayName(value) {
  return value
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function toSecretName(projectId) {
  return `FIREBASE_DEPLOY_TOKEN_${projectId.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function parseCliArguments(argv) {
  const options = {
    targetDirectory: '',
    appName: '',
    firebaseProjectId: '',
    noGitHub: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (!argument.startsWith('--') && !options.targetDirectory) {
      options.targetDirectory = argument;
      continue;
    }

    if (argument === '--no-github') {
      options.noGitHub = true;
      continue;
    }

    if (argument === '--app-name') {
      options.appName = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (argument.startsWith('--app-name=')) {
      options.appName = argument.slice('--app-name='.length);
      continue;
    }

    if (argument === '--firebase-project') {
      options.firebaseProjectId = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (argument.startsWith('--firebase-project=')) {
      options.firebaseProjectId = argument.slice('--firebase-project='.length);
    }
  }

  return options;
}

function parseFirebaseProjects(rawOutput) {
  if (!rawOutput) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawOutput);
    const projectLists = [parsed, parsed?.results, parsed?.projectResults].filter(Array.isArray);

    const projectIds = projectLists.flatMap((list) =>
      list
        .map((item) => item?.projectId || item?.project || item?.project_id || null)
        .filter(Boolean),
    );

    return [...new Set(projectIds)].sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function parseFirebaseToken(output) {
  const tokenLine = output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^\d+\/[A-Za-z0-9._/-]+$/.test(line));

  if (!tokenLine) {
    throw new Error('Unable to parse the Firebase CI token from `firebase login:ci` output.');
  }

  return tokenLine;
}

async function promptText(rl, label, defaultValue = '') {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  return answer || defaultValue;
}

async function promptYesNo(rl, label, defaultValue = true) {
  const suffix = defaultValue ? 'Y/n' : 'y/N';
  const answer = (await rl.question(`${label} [${suffix}]: `)).trim().toLowerCase();

  if (!answer) {
    return defaultValue;
  }

  return ['y', 'yes'].includes(answer);
}

async function promptSelect(rl, label, options, defaultIndex = 0) {
  console.log(`\n${label}`);
  options.forEach((option, index) => {
    const isDefault = index === defaultIndex ? ' (default)' : '';
    console.log(`  ${index + 1}. ${option.label}${isDefault}`);
  });

  while (true) {
    const answer = (await rl.question('Choose an option number: ')).trim();

    if (!answer) {
      return options[defaultIndex];
    }

    const selectedIndex = Number(answer) - 1;

    if (Number.isInteger(selectedIndex) && options[selectedIndex]) {
      return options[selectedIndex];
    }

    console.log('Enter one of the listed option numbers.');
  }
}

async function collectFirebaseProject(rl, firebaseCliAvailable) {
  const projectIds = firebaseCliAvailable
    ? parseFirebaseProjects(captureCommand('firebase', ['projects:list', '--json']))
    : [];

  if (projectIds.length === 0) {
    const firebaseProjectId = sanitizePackageName(
      await promptText(rl, 'Firebase project ID to deploy to', 'my-firebase-project'),
    );

    return {
      firebaseProjectId,
      requiresInit: true,
    };
  }

  const projectOptions = projectIds.map((projectId) => ({
    label: projectId,
    value: projectId,
    requiresInit: false,
  }));

  projectOptions.push({
    label: 'Enter a different Firebase project ID',
    value: '__custom__',
    requiresInit: true,
  });

  const selectedProject = await promptSelect(rl, 'Choose the Firebase project for deploys', projectOptions);

  if (selectedProject.value !== '__custom__') {
    return {
      firebaseProjectId: selectedProject.value,
      requiresInit: false,
    };
  }

  const firebaseProjectId = sanitizePackageName(
    await promptText(rl, 'New Firebase project ID', 'my-firebase-project'),
  );

  return {
    firebaseProjectId,
    requiresInit: true,
  };
}

async function resolveFirebaseProject(rl, firebaseCliAvailable, presetProjectId) {
  const projectIds = firebaseCliAvailable
    ? parseFirebaseProjects(captureCommand('firebase', ['projects:list', '--json']))
    : [];

  if (presetProjectId) {
    const firebaseProjectId = sanitizePackageName(presetProjectId);
    return {
      firebaseProjectId,
      requiresInit: !projectIds.includes(firebaseProjectId),
    };
  }

  if (projectIds.length === 0) {
    return collectFirebaseProject(rl, firebaseCliAvailable);
  }

  const projectOptions = projectIds.map((projectId) => ({
    label: projectId,
    value: projectId,
    requiresInit: false,
  }));

  projectOptions.push({
    label: 'Enter a different Firebase project ID',
    value: '__custom__',
    requiresInit: true,
  });

  const selectedProject = await promptSelect(rl, 'Choose the Firebase project for deploys', projectOptions);

  if (selectedProject.value !== '__custom__') {
    return {
      firebaseProjectId: selectedProject.value,
      requiresInit: false,
    };
  }

  const firebaseProjectId = sanitizePackageName(
    await promptText(rl, 'New Firebase project ID', 'my-firebase-project'),
  );

  return {
    firebaseProjectId,
    requiresInit: true,
  };
}

async function writeFirebaseConfigFiles(targetDirectory, replacements) {
  await writeFile(
    path.join(targetDirectory, 'firebase.json'),
    replaceTemplateTokens(FIREBASE_CONFIG_TEMPLATE, replacements),
    'utf8',
  );
  await writeFile(
    path.join(targetDirectory, '.firebaserc'),
    replaceTemplateTokens(FIREBASERC_TEMPLATE, replacements),
    'utf8',
  );
}

async function initializeGitRepository(targetDirectory) {
  if (!commandExists('git')) {
    throw new Error('`git` is required but is not installed.');
  }

  await runCommand('git', ['init'], { cwd: targetDirectory });
  await runCommand('git', ['branch', '-M', 'main'], { cwd: targetDirectory });
}

async function ensureOriginRemote(targetDirectory, repoSlug) {
  const remoteUrl = captureCommand('gh', ['repo', 'view', repoSlug, '--json', 'url', '--jq', '.url']);

  if (!remoteUrl) {
    throw new Error(`Unable to read the remote URL for ${repoSlug}.`);
  }

  if (commandSucceeds('git', ['remote', 'get-url', 'origin'], targetDirectory)) {
    await runCommand('git', ['remote', 'set-url', 'origin', remoteUrl], { cwd: targetDirectory });
    return;
  }

  await runCommand('git', ['remote', 'add', 'origin', remoteUrl], { cwd: targetDirectory });
}

async function maybeCreateGitHubRepo(targetDirectory, repoSlug, visibility) {
  if (commandSucceeds('gh', ['repo', 'view', repoSlug])) {
    await ensureOriginRemote(targetDirectory, repoSlug);
    return captureCommand('gh', ['repo', 'view', repoSlug, '--json', 'nameWithOwner', '--jq', '.nameWithOwner']) || repoSlug;
  }

  const visibilityFlag = visibility === 'public' ? '--public' : '--private';

  await runCommand(
    'gh',
    ['repo', 'create', repoSlug, visibilityFlag, '--source', '.', '--remote', 'origin'],
    { cwd: targetDirectory },
  );

  return captureCommand('gh', ['repo', 'view', repoSlug, '--json', 'nameWithOwner', '--jq', '.nameWithOwner']) || repoSlug;
}

async function maybeRunFirebaseInit(targetDirectory) {
  console.log('\nRunning `firebase init hosting` so the new project is initialized locally.');
  await runCommand('firebase', ['init', 'hosting'], { cwd: targetDirectory });
}

async function generateFirebaseDeployToken() {
  console.log('\nGenerating a Firebase CI token. Complete the browser/device flow if prompted.');
  const { stdout } = await runCommand('firebase', ['login:ci', '--no-localhost'], {
    capture: true,
  });
  return parseFirebaseToken(stdout);
}

function printNextSteps({ targetDirectory, remoteConfigured, secretConfigured, repoSlug, firebaseProjectId }) {
  console.log('\nScaffold complete.');
  console.log(`\nProject directory: ${targetDirectory}`);
  console.log(`Firebase project: ${firebaseProjectId}`);

  if (repoSlug) {
    console.log(`GitHub repository: ${repoSlug}`);
  }

  if (remoteConfigured && secretConfigured) {
    console.log('\nNext steps:');
    console.log('  git add .');
    console.log('  git commit -m "Initial commit"');
    console.log('  git push -u origin main');
    console.log('After the push lands on `main`, GitHub Actions will build and deploy the site to Firebase Hosting.');
    return;
  }

  console.log('\nNext steps:');
  console.log('  git add .');
  console.log('  git commit -m "Initial commit"');

  if (remoteConfigured) {
    console.log('  git push -u origin main');
  } else {
    console.log('  create or connect a GitHub repository, then push `main`');
  }

  if (!secretConfigured) {
    console.log(
      '  add the Firebase deploy token secret in GitHub before expecting the `main` push workflow to deploy',
    );
  }
}

export async function runScaffolder() {
  const cliOptions = parseCliArguments(process.argv.slice(2));
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let promptsClosed = false;

  try {
    const projectDirectoryInput =
      cliOptions.targetDirectory || (await promptText(rl, 'Project directory name', 'my-website'));
    const resolvedTargetDirectory = path.resolve(process.cwd(), projectDirectoryInput);
    const inferredPackageName = sanitizePackageName(path.basename(resolvedTargetDirectory));
    const displayName = cliOptions.appName || (await promptText(rl, 'App name', toDisplayName(inferredPackageName)));

    await ensureEmptyDestination(resolvedTargetDirectory);

    const firebaseCliAvailable = commandExists('firebase');
    const ghCliAvailable = commandExists('gh');
    const ghAuthenticated = ghCliAvailable && commandSucceeds('gh', ['auth', 'status']);
    const { firebaseProjectId, requiresInit } = await resolveFirebaseProject(
      rl,
      firebaseCliAvailable,
      cliOptions.firebaseProjectId,
    );

    let shouldSetupGitHub = false;
    let repoSlug = '';
    let repoVisibility = 'private';
    let shouldCreateDeployToken = false;

    if (ghAuthenticated && !cliOptions.noGitHub) {
      shouldSetupGitHub = await promptYesNo(
        rl,
        'Create or connect a GitHub repository now so Actions can deploy on push',
        true,
      );

      if (shouldSetupGitHub) {
        const defaultOwner = captureCommand('gh', ['api', 'user', '--jq', '.login']) || '';
        const defaultRepoSlug = defaultOwner ? `${defaultOwner}/${inferredPackageName}` : inferredPackageName;
        repoSlug = await promptText(rl, 'GitHub repository (owner/repo)', defaultRepoSlug);
        const selectedVisibility = await promptSelect(
          rl,
          'GitHub repository visibility',
          [
            { label: 'Private', value: 'private' },
            { label: 'Public', value: 'public' },
          ],
        );
        repoVisibility = selectedVisibility.value;
        shouldCreateDeployToken = await promptYesNo(
          rl,
          `Generate a Firebase CI token and save it as ${toSecretName(firebaseProjectId)}`,
          true,
        );
      }
    }

    rl.close();
    promptsClosed = true;

    const replacements = {
      '__PACKAGE_NAME__': inferredPackageName,
      '__APP_NAME__': displayName,
      '__SITE_DESCRIPTION__':
        `${displayName} is a mobile-first website built with React, Vite, Tailwind CSS, and Firebase Hosting.`,
      '__SITE_URL__': `https://${firebaseProjectId}.web.app`,
      '__FIREBASE_PROJECT_ID__': firebaseProjectId,
      '__FIREBASE_TOKEN_SECRET__': toSecretName(firebaseProjectId),
    };

    await copyTemplateDirectory(TEMPLATE_DIR, resolvedTargetDirectory, replacements);

    if (requiresInit) {
      if (!firebaseCliAvailable) {
        console.warn(
          '\nFirebase CLI is not installed, so `firebase init hosting` could not be run automatically. The template config was still generated for you.',
        );
      } else {
        await maybeRunFirebaseInit(resolvedTargetDirectory);
      }
    }

    await writeFirebaseConfigFiles(resolvedTargetDirectory, replacements);

    await installProjectDependencies(resolvedTargetDirectory);

    await initializeGitRepository(resolvedTargetDirectory);

    let remoteConfigured = false;
    let secretConfigured = false;

    if (shouldSetupGitHub && repoSlug) {
      repoSlug = await maybeCreateGitHubRepo(resolvedTargetDirectory, repoSlug, repoVisibility);
      remoteConfigured = true;

      if (shouldCreateDeployToken) {
        if (!firebaseCliAvailable) {
          console.warn(
            '\nFirebase CLI is not available, so the GitHub Actions deploy secret could not be created automatically.',
          );
        } else {
          const firebaseToken = await generateFirebaseDeployToken();
          await runCommand(
            'gh',
            ['secret', 'set', toSecretName(firebaseProjectId), '--repo', repoSlug, '--body', firebaseToken],
            { cwd: resolvedTargetDirectory },
          );
          secretConfigured = true;
        }
      }
    } else if (!ghAuthenticated && !cliOptions.noGitHub) {
      console.warn(
        '\nGitHub CLI is missing or not authenticated, so repository creation and secret setup were skipped.',
      );
    }

    printNextSteps({
      targetDirectory: resolvedTargetDirectory,
      remoteConfigured,
      secretConfigured,
      repoSlug,
      firebaseProjectId,
    });
  } finally {
    if (!promptsClosed) {
      rl.close();
    }
  }
}
