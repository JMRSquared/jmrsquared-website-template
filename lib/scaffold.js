import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const TEMPLATE_DIR = fileURLToPath(new URL('../template', import.meta.url));

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

function toCloudflareApiTokenSecretName(projectName) {
  return `CLOUDFLARE_API_TOKEN_${projectName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function toCloudflareAccountIdVariableName(projectName) {
  return `CLOUDFLARE_ACCOUNT_ID_${projectName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function parseCliArguments(argv) {
  const options = {
    targetDirectory: '',
    appName: '',
    cloudflareProjectName: '',
    cloudflareAccountId: '',
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

    if (argument === '--cloudflare-project') {
      options.cloudflareProjectName = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (argument.startsWith('--cloudflare-project=')) {
      options.cloudflareProjectName = argument.slice('--cloudflare-project='.length);
      continue;
    }

    if (argument === '--cloudflare-account-id') {
      options.cloudflareAccountId = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (argument.startsWith('--cloudflare-account-id=')) {
      options.cloudflareAccountId = argument.slice('--cloudflare-account-id='.length);
    }
  }

  return options;
}

function parseCloudflareAccounts(rawOutput) {
  if (!rawOutput) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawOutput);
    const accountList = Array.isArray(parsed?.accounts) ? parsed.accounts : [];

    return accountList
      .map((account) => ({
        id: String(account?.id || '').trim(),
        name: String(account?.name || '').trim() || String(account?.id || '').trim(),
      }))
      .filter((account) => account.id);
  } catch {
    return [];
  }
}

function parseCloudflarePagesProjects(rawOutput) {
  if (!rawOutput) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawOutput);
    const projectList = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.result) ? parsed.result : [];

    return projectList
      .map((project) => String(project?.name || '').trim())
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
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

async function resolveCloudflareTarget(rl, wranglerCliAvailable, presetProjectName, presetAccountId) {
  const accountIdFromPreset = presetAccountId.trim();
  const projectNameFromPreset = sanitizePackageName(presetProjectName);

  if (!wranglerCliAvailable) {
    const cloudflareProjectName = projectNameFromPreset || sanitizePackageName(
      await promptText(rl, 'Cloudflare Pages project name', 'my-pages-project'),
    );
    return {
      cloudflareProjectName,
      cloudflareAccountId: accountIdFromPreset,
    };
  }

  const accounts = parseCloudflareAccounts(captureCommand('wrangler', ['whoami', '--json']));
  const availableAccountIds = accounts.map((account) => account.id);
  const hasPresetAccount = Boolean(accountIdFromPreset && availableAccountIds.includes(accountIdFromPreset));
  const cloudflareAccountId = hasPresetAccount
    ? accountIdFromPreset
    : (accounts[0]?.id ?? accountIdFromPreset);

  const cloudflareProjectName = projectNameFromPreset || sanitizePackageName(
    await promptText(rl, 'Cloudflare Pages project name', 'my-pages-project'),
  );

  return {
    cloudflareProjectName,
    cloudflareAccountId,
  };
}

async function ensureCloudflarePagesProject(rl, wranglerCliAvailable, cloudflareProjectName, cloudflareAccountId) {
  if (!wranglerCliAvailable) {
    return { cloudflareProjectName };
  }

  let resolvedProjectName = cloudflareProjectName;

  while (true) {
    const existingProjects = parseCloudflarePagesProjects(
      captureCommand('wrangler', ['pages', 'project', 'list', '--json'], process.cwd()),
    );

    if (existingProjects.includes(resolvedProjectName)) {
      return { cloudflareProjectName: resolvedProjectName };
    }

    console.log(
      `\nCloudflare Pages project "${resolvedProjectName}" was not found in your account. Attempting to create it now.`,
    );

    try {
      await runCommand(
        'wrangler',
        ['pages', 'project', 'create', resolvedProjectName, '--production-branch', 'main'],
        { envOverrides: { CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId } },
      );
      return { cloudflareProjectName: resolvedProjectName };
    } catch {
      const tryAnotherProject = await promptYesNo(
        rl,
        `Failed to create or access Cloudflare Pages project "${resolvedProjectName}". Enter a different project name`,
        true,
      );

      if (!tryAnotherProject) {
        throw new Error(
          `Failed to get Cloudflare Pages project ${resolvedProjectName}. Please make sure the project exists and your account has permission to access it.`,
        );
      }

      resolvedProjectName = sanitizePackageName(
        await promptText(rl, 'New Cloudflare Pages project name', 'my-pages-project'),
      );
    }
  }
}

async function initializeGitRepository(targetDirectory) {
  if (!commandExists('git')) {
    throw new Error('`git` is required but is not installed.');
  }

  await runCommand('git', ['init'], { cwd: targetDirectory });
  await runCommand('git', ['branch', '-M', 'main'], { cwd: targetDirectory });
}

async function ensureOriginRemote(targetDirectory, repoSlug) {
  const remoteUrl = captureCommand('gh', ['repo', 'view', repoSlug, '--json', 'sshUrl', '--jq', '.sshUrl']);

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
  await ensureOriginRemote(targetDirectory, repoSlug);

  return captureCommand('gh', ['repo', 'view', repoSlug, '--json', 'nameWithOwner', '--jq', '.nameWithOwner']) || repoSlug;
}

async function createInitialCommit(targetDirectory) {
  await runCommand('git', ['add', '.'], { cwd: targetDirectory });
  await runCommand('git', ['commit', '-m', ':tada: Initial commit'], { cwd: targetDirectory });
}

async function pushInitialCommit(targetDirectory) {
  await runCommand('git', ['push', '-u', 'origin', 'main'], { cwd: targetDirectory });
}

function printNextSteps({
  targetDirectory,
  remoteConfigured,
  secretConfigured,
  variableConfigured,
  repoSlug,
  cloudflareProjectName,
  cloudflareAccountId,
}) {
  console.log('\nScaffold complete.');
  console.log(`\nProject directory: ${targetDirectory}`);
  console.log(`Cloudflare Pages project: ${cloudflareProjectName}`);
  if (cloudflareAccountId) {
    console.log(`Cloudflare account ID: ${cloudflareAccountId}`);
  }

  if (repoSlug) {
    console.log(`GitHub repository: ${repoSlug}`);
  }

  if (remoteConfigured && secretConfigured && variableConfigured) {
    console.log('\nNext steps:');
    console.log('  Initial commit was created and pushed to `main` automatically.');
    console.log('After the push lands on `main`, GitHub Actions will build and deploy the site to Cloudflare Pages.');
    return;
  }

  console.log('\nNext steps:');
  if (remoteConfigured) {
    console.log('  Initial commit was created and pushed to `main` automatically.');
  } else {
    console.log('  configure GitHub CLI auth, then rerun scaffolder to auto-create repo and push');
  }

  if (!secretConfigured || !variableConfigured) {
    console.log(
      '  add Cloudflare deploy credentials in GitHub (API token secret + account ID variable) before expecting the `main` push workflow to deploy',
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
      cliOptions.targetDirectory || (await promptText(rl, 'Project name', 'my-website'));
    const resolvedTargetDirectory = path.resolve(process.cwd(), projectDirectoryInput);
    const inferredPackageName = sanitizePackageName(path.basename(resolvedTargetDirectory));
    const displayName = cliOptions.appName || (await promptText(rl, 'App name', toDisplayName(inferredPackageName)));

    await ensureEmptyDestination(resolvedTargetDirectory);

    const wranglerCliAvailable = commandExists('wrangler');
    const ghCliAvailable = commandExists('gh');
    const ghAuthenticated = ghCliAvailable && commandSucceeds('gh', ['auth', 'status']);
    if (!cliOptions.noGitHub && !ghAuthenticated) {
      throw new Error('GitHub CLI must be installed and authenticated because scaffolding now creates and pushes the initial commit automatically.');
    }
    const cloudflareTargetSelection = await resolveCloudflareTarget(
      rl,
      wranglerCliAvailable,
      cliOptions.cloudflareProjectName,
      cliOptions.cloudflareAccountId,
    );
    const { cloudflareProjectName } = await ensureCloudflarePagesProject(
      rl,
      wranglerCliAvailable,
      cloudflareTargetSelection.cloudflareProjectName,
      cloudflareTargetSelection.cloudflareAccountId,
    );
    const { cloudflareAccountId } = cloudflareTargetSelection;

    let shouldSetupGitHub = !cliOptions.noGitHub;
    let repoSlug = '';
    const repoVisibility = 'public';
    const cloudflareApiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
    const cloudflareAccountIdFromEnv = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();

    if (shouldSetupGitHub) {
      const defaultRepoSlug = `JMRSquared/${inferredPackageName}`;
      repoSlug = await promptText(rl, 'GitHub repository (owner/repo)', defaultRepoSlug);
    }

    rl.close();
    promptsClosed = true;

    const replacements = {
      '__PACKAGE_NAME__': inferredPackageName,
      '__APP_NAME__': displayName,
      '__SITE_DESCRIPTION__':
        `${displayName} is a mobile-first website built with React, Vite, Tailwind CSS, and Cloudflare Pages.`,
      '__SITE_URL__': `https://${cloudflareProjectName}.pages.dev`,
      '__CLOUDFLARE_PROJECT_NAME__': cloudflareProjectName,
      '__CLOUDFLARE_API_TOKEN_SECRET__': toCloudflareApiTokenSecretName(cloudflareProjectName),
      '__CLOUDFLARE_ACCOUNT_ID_VAR__': toCloudflareAccountIdVariableName(cloudflareProjectName),
    };

    await copyTemplateDirectory(TEMPLATE_DIR, resolvedTargetDirectory, replacements);

    await installProjectDependencies(resolvedTargetDirectory);

    await initializeGitRepository(resolvedTargetDirectory);

    let remoteConfigured = false;
    let secretConfigured = false;
    let variableConfigured = false;

    if (shouldSetupGitHub && repoSlug) {
      repoSlug = await maybeCreateGitHubRepo(resolvedTargetDirectory, repoSlug, repoVisibility);
      remoteConfigured = true;

      if (cloudflareApiToken) {
        await runCommand(
          'gh',
          [
            'secret',
            'set',
            toCloudflareApiTokenSecretName(cloudflareProjectName),
            '--repo',
            repoSlug,
            '--body',
            cloudflareApiToken,
          ],
          { cwd: resolvedTargetDirectory },
        );
        secretConfigured = true;
      }

      const cloudflareAccountIdForGitHub = cloudflareAccountIdFromEnv || cloudflareAccountId;
      if (cloudflareAccountIdForGitHub) {
        await runCommand(
          'gh',
          [
            'variable',
            'set',
            toCloudflareAccountIdVariableName(cloudflareProjectName),
            '--repo',
            repoSlug,
            '--body',
            cloudflareAccountIdForGitHub,
          ],
          { cwd: resolvedTargetDirectory },
        );
        variableConfigured = true;
      }
    }

    await createInitialCommit(resolvedTargetDirectory);
    if (remoteConfigured) {
      await pushInitialCommit(resolvedTargetDirectory);
    }

    printNextSteps({
      targetDirectory: resolvedTargetDirectory,
      remoteConfigured,
      secretConfigured,
      variableConfigured,
      repoSlug,
      cloudflareProjectName,
      cloudflareAccountId,
    });
  } finally {
    if (!promptsClosed) {
      rl.close();
    }
  }
}
