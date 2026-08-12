import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import {
  confirmAgentLaunch,
  promptCodingAgent,
  runWebsiteAgent,
  writeWebsiteAgentMission,
} from './website-agent.js';

const TEMPLATE_DIR = fileURLToPath(new URL('../template', import.meta.url));
const FULL_TEMPLATE_SCRIPT = fileURLToPath(new URL('../bin/init-gkm-and-beads.sh', import.meta.url));
const PROVIDERS = {
  cloudflare: 'cloudflare',
  firebase: 'firebase',
};
const TEMPLATES = {
  full: 'full',
};

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

function captureCommand(command, args, cwd = process.cwd(), envOverrides = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...envOverrides },
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

const CLOUDFLARE_API_TOKEN_SECRET_NAME = 'CLOUDFLARE_API_TOKEN';
const CLOUDFLARE_ACCOUNT_ID_SECRET_NAME = 'CLOUDFLARE_ACCOUNT_ID';
const FIREBASE_TOKEN_SECRET_NAME = 'FIREBASE_TOKEN';

function extractTemplateFlag(argv) {
  const remaining = [];
  let template = '';

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--template') {
      template = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (argument.startsWith('--template=')) {
      template = argument.slice('--template='.length);
      continue;
    }

    remaining.push(argument);
  }

  return { template, remaining };
}

function parseCliArguments(argv) {
  const options = {
    targetDirectory: '',
    appName: '',
    provider: '',
    cloudflareProjectName: '',
    cloudflareAccountId: '',
    firebaseProjectId: '',
    noGitHub: false,
    template: '',
    templatePassthroughArgs: [],
  };

  const { template, remaining } = extractTemplateFlag(argv);
  if (template) {
    options.template = template;
    options.templatePassthroughArgs = remaining;
    return options;
  }

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
      continue;
    }

    if (argument === '--provider') {
      options.provider = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (argument.startsWith('--provider=')) {
      options.provider = argument.slice('--provider='.length);
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

function normalizeProvider(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return PROVIDERS.cloudflare;
  }

  if (normalized === PROVIDERS.cloudflare) {
    return PROVIDERS.cloudflare;
  }

  if (normalized === PROVIDERS.firebase) {
    return PROVIDERS.firebase;
  }

  throw new Error('Invalid provider. Use "cloudflare" or "firebase".');
}

async function promptProvider(rl, defaultValue = PROVIDERS.cloudflare) {
  const answer = (await rl.question(`Deploy provider [cloudflare/firebase] (${defaultValue}): `)).trim();

  if (!answer) {
    return defaultValue;
  }

  const normalized = answer.toLowerCase();
  if (normalized === PROVIDERS.cloudflare || normalized === PROVIDERS.firebase) {
    return normalized;
  }

  throw new Error('Invalid provider. Use "cloudflare" or "firebase".');
}

async function resolveCloudflareTarget(wranglerCliAvailable, projectName, presetAccountId) {
  const accountIdFromPreset = presetAccountId.trim();
  const cloudflareProjectName = sanitizePackageName(projectName);
  const cloudflareAccountIdFromEnv = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const cloudflareApiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  const wranglerEnvOverrides = {
    ...(cloudflareApiToken ? { CLOUDFLARE_API_TOKEN: cloudflareApiToken } : {}),
    ...(cloudflareAccountIdFromEnv ? { CLOUDFLARE_ACCOUNT_ID: cloudflareAccountIdFromEnv } : {}),
  };

  if (!wranglerCliAvailable) {
    throw new Error(
      '`wrangler` is required because scaffolding now creates the Cloudflare Pages project automatically. Install `wrangler` and rerun.',
    );
  }

  const accounts = parseCloudflareAccounts(
    captureCommand('wrangler', ['whoami', '--json'], process.cwd(), wranglerEnvOverrides),
  );
  const availableAccountIds = accounts.map((account) => account.id);
  const hasPresetAccount = Boolean(accountIdFromPreset && availableAccountIds.includes(accountIdFromPreset));
  const hasEnvAccount = Boolean(cloudflareAccountIdFromEnv && availableAccountIds.includes(cloudflareAccountIdFromEnv));
  const cloudflareAccountId = hasPresetAccount
    ? accountIdFromPreset
    : hasEnvAccount
      ? cloudflareAccountIdFromEnv
      : (accounts[0]?.id ?? accountIdFromPreset ?? cloudflareAccountIdFromEnv);

  return {
    cloudflareProjectName,
    cloudflareAccountId,
  };
}

function parseFirebaseProjects(rawOutput) {
  if (!rawOutput) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawOutput);
    const projects = Array.isArray(parsed?.results) ? parsed.results : [];

    return projects
      .map((project) => String(project?.projectId || '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function resolveFirebaseTarget(firebaseCliAvailable, projectName, presetProjectId) {
  if (!firebaseCliAvailable) {
    throw new Error('`firebase` CLI is required when using the Firebase provider. Install `firebase-tools` and rerun.');
  }

  const firebaseToken = (process.env.FIREBASE_TOKEN || '').trim();
  if (!firebaseToken) {
    throw new Error('`FIREBASE_TOKEN` is required for Firebase provider setup.');
  }

  const firebaseProjectId = sanitizePackageName(presetProjectId || projectName);
  const existingProjects = parseFirebaseProjects(
    captureCommand('firebase', ['projects:list', '--json', '--token', firebaseToken]),
  );

  if (existingProjects.includes(firebaseProjectId)) {
    throw new Error(`Firebase project "${firebaseProjectId}" already exists. Use a different project name.`);
  }

  await runCommand('firebase', ['projects:create', firebaseProjectId, '--display-name', toDisplayName(projectName), '--token', firebaseToken]);

  return {
    firebaseProjectId,
  };
}

async function writeFirebaseConfigFiles(targetDirectory, firebaseProjectId) {
  const firebaseJsonPath = path.join(targetDirectory, 'firebase.json');
  const firebasercPath = path.join(targetDirectory, '.firebaserc');
  const firebaseJson = JSON.stringify(
    {
      hosting: {
        public: 'dist',
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        rewrites: [{ source: '**', destination: '/index.html' }],
      },
    },
    null,
    2,
  );
  const firebaserc = JSON.stringify(
    {
      projects: {
        default: firebaseProjectId,
      },
    },
    null,
    2,
  );

  await writeFile(firebaseJsonPath, `${firebaseJson}\n`, 'utf8');
  await writeFile(firebasercPath, `${firebaserc}\n`, 'utf8');
}

async function ensureCloudflarePagesProject(rl, wranglerCliAvailable, cloudflareProjectName, cloudflareAccountId) {
  if (!wranglerCliAvailable) {
    throw new Error(
      '`wrangler` is required because scaffolding now creates the Cloudflare Pages project automatically. Install `wrangler` and rerun.',
    );
  }

  const cloudflareApiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  const wranglerEnvOverrides = {
    ...(cloudflareApiToken ? { CLOUDFLARE_API_TOKEN: cloudflareApiToken } : {}),
    ...(cloudflareAccountId ? { CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId } : {}),
  };
  let resolvedProjectName = cloudflareProjectName;

  while (true) {
    const existingProjects = parseCloudflarePagesProjects(
      captureCommand('wrangler', ['pages', 'project', 'list', '--json'], process.cwd(), wranglerEnvOverrides),
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
        { envOverrides: wranglerEnvOverrides },
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
  repoSlug,
  provider,
  deployProjectName,
  deployAccountId,
}) {
  console.log('\nScaffold complete.');
  console.log(`\nProject directory: ${targetDirectory}`);
  console.log(`Deploy provider: ${provider}`);
  console.log(`Deploy project: ${deployProjectName}`);
  if (deployAccountId) {
    console.log(`Cloudflare account ID: ${deployAccountId}`);
  }

  if (repoSlug) {
    console.log(`GitHub repository: ${repoSlug}`);
  }

  if (remoteConfigured && secretConfigured) {
    console.log('\nNext steps:');
    console.log('  Initial commit was created and pushed to `main` automatically.');
    console.log('After the push lands on `main`, GitHub Actions will build and deploy the site.');
    return;
  }

  console.log('\nNext steps:');
  if (remoteConfigured) {
    console.log('  Initial commit was created and pushed to `main` automatically.');
  } else {
    console.log('  configure GitHub CLI auth, then rerun scaffolder to auto-create repo and push');
  }

  if (!secretConfigured) {
    if (provider === PROVIDERS.cloudflare) {
      console.log(
        '  add Cloudflare deploy credentials in GitHub (`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`) before expecting the `main` push workflow to deploy',
      );
      return;
    }

    console.log('  add Firebase deploy credential in GitHub (`FIREBASE_TOKEN`) before expecting the `main` push workflow to deploy');
  }
}

async function runFullTemplate(passthroughArgs) {
  if (!(await pathExists(FULL_TEMPLATE_SCRIPT))) {
    throw new Error(`init-gkm-and-beads.sh not found at ${FULL_TEMPLATE_SCRIPT}`);
  }

  await runCommand('bash', [FULL_TEMPLATE_SCRIPT, ...passthroughArgs]);
}

export async function runScaffolder() {
  const cliOptions = parseCliArguments(process.argv.slice(2));

  if (cliOptions.template) {
    const normalizedTemplate = String(cliOptions.template).trim().toLowerCase();

    if (normalizedTemplate !== TEMPLATES.full) {
      throw new Error(`Unknown template "${cliOptions.template}". Supported: full.`);
    }

    await runFullTemplate(cliOptions.templatePassthroughArgs);
    return;
  }

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
    const provider = cliOptions.provider
      ? normalizeProvider(cliOptions.provider)
      : await promptProvider(rl, PROVIDERS.cloudflare);

    await ensureEmptyDestination(resolvedTargetDirectory);

    const wranglerCliAvailable = commandExists('wrangler');
    const firebaseCliAvailable = commandExists('firebase');
    const ghCliAvailable = commandExists('gh');
    const ghAuthenticated = ghCliAvailable && commandSucceeds('gh', ['auth', 'status']);
    if (!cliOptions.noGitHub && !ghAuthenticated) {
      throw new Error('GitHub CLI must be installed and authenticated because scaffolding now creates and pushes the initial commit automatically.');
    }
    let deployProjectName = '';
    let deployAccountId = '';
    let siteUrl = '';
    let deployCommand = '';
    let deployProviderName = '';
    let deployWorkflowEnvBlock = '';
    let deployWorkflowConfigBlock = '';
    let deployProjectReference = '';
    let deployDependencyName = '';
    let deployDependencyVersion = '';
    let deploySecretDefinitions = [];

    if (provider === PROVIDERS.cloudflare) {
      const cloudflareTargetSelection = await resolveCloudflareTarget(
        wranglerCliAvailable,
        cliOptions.cloudflareProjectName || inferredPackageName,
        cliOptions.cloudflareAccountId,
      );
      const { cloudflareProjectName } = await ensureCloudflarePagesProject(
        rl,
        wranglerCliAvailable,
        cloudflareTargetSelection.cloudflareProjectName,
        cloudflareTargetSelection.cloudflareAccountId,
      );

      deployProjectName = cloudflareProjectName;
      deployAccountId = cloudflareTargetSelection.cloudflareAccountId;
      siteUrl = `https://${cloudflareProjectName}.pages.dev`;
      deployCommand = `wrangler pages deploy dist --project-name '${cloudflareProjectName}' --branch main`;
      deployProviderName = 'Cloudflare Pages';
      deployWorkflowEnvBlock = [
        '          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
        '          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
      ].join('\n');
      deployProjectReference = `Cloudflare Pages project: \`${cloudflareProjectName}\``;
      deployDependencyName = 'wrangler';
      deployDependencyVersion = '^4';
      deploySecretDefinitions = [
        {
          name: CLOUDFLARE_API_TOKEN_SECRET_NAME,
          value: (process.env.CLOUDFLARE_API_TOKEN || '').trim(),
        },
        {
          name: CLOUDFLARE_ACCOUNT_ID_SECRET_NAME,
          value: (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim() || deployAccountId,
        },
      ];
    } else {
      const firebaseTargetSelection = await resolveFirebaseTarget(
        firebaseCliAvailable,
        cliOptions.firebaseProjectId || inferredPackageName,
        cliOptions.firebaseProjectId,
      );

      deployProjectName = firebaseTargetSelection.firebaseProjectId;
      siteUrl = `https://${firebaseTargetSelection.firebaseProjectId}.web.app`;
      deployCommand = `firebase deploy --only hosting --project '${firebaseTargetSelection.firebaseProjectId}'`;
      deployProviderName = 'Firebase Hosting';
      deployWorkflowEnvBlock = '          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}';
      deployProjectReference = `Firebase project: \`${firebaseTargetSelection.firebaseProjectId}\``;
      deployDependencyName = 'firebase-tools';
      deployDependencyVersion = '^14.22.0';
      deploySecretDefinitions = [
        {
          name: FIREBASE_TOKEN_SECRET_NAME,
          value: (process.env.FIREBASE_TOKEN || '').trim(),
        },
      ];
    }

    const shouldSetupGitHub = !cliOptions.noGitHub;
    let repoSlug = '';
    const repoVisibility = 'private';
    if (shouldSetupGitHub) {
      const defaultRepoSlug = `JMRSquared/${inferredPackageName}`;
      repoSlug = await promptText(rl, 'GitHub repository (owner/repo)', defaultRepoSlug);
    }

    const projectBriefInput = await promptText(
      rl,
      'Project brief (paste .md content, local .md path, or URL)',
      '',
    );
    const codingAgent = await promptCodingAgent(rl);
    await confirmAgentLaunch(rl, codingAgent, resolvedTargetDirectory);

    rl.close();
    promptsClosed = true;

    let projectBriefContent = projectBriefInput.trim();

    if (projectBriefContent.startsWith('http://') || projectBriefContent.startsWith('https://')) {
      try {
        const url = new URL(projectBriefContent);
        const response = await fetch(url.href);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        projectBriefContent = await response.text();
      } catch (error) {
        const fetchError = error instanceof Error ? error.message : String(error);
        console.warn(`\nFailed to fetch project brief from URL: ${fetchError}`);
        console.warn('Proceeding without project brief.');
        projectBriefContent = '';
      }
    } else if (projectBriefContent) {
      const briefPathCandidate = path.resolve(process.cwd(), projectBriefContent);

      if (await pathExists(briefPathCandidate)) {
        const briefStats = await stat(briefPathCandidate);

        if (briefStats.isFile()) {
          projectBriefContent = await readFile(briefPathCandidate, 'utf8');
        }
      }
    }

    const projectBriefPath = path.join(resolvedTargetDirectory, 'project-brief.md');
    if (projectBriefContent) {
      await writeFile(projectBriefPath, projectBriefContent, 'utf8');
    }

    const replacements = {
      '__PACKAGE_NAME__': inferredPackageName,
      '__APP_NAME__': displayName,
      '__SITE_DESCRIPTION__':
        `${displayName} is a blank React, Vite, and Tailwind CSS website deployed on ${deployProviderName}.`,
      '__SITE_URL__': siteUrl,
      '__DEPLOY_PROVIDER_NAME__': deployProviderName,
      '__DEPLOY_PROJECT_REFERENCE__': deployProjectReference,
      '__DEPLOY_COMMAND__': deployCommand,
      '__DEPLOY_WORKFLOW_CONFIG_BLOCK__': deployWorkflowConfigBlock,
      '__DEPLOY_WORKFLOW_ENV_BLOCK__': deployWorkflowEnvBlock,
      '__DEPLOY_DEPENDENCY_NAME__': deployDependencyName,
      '__DEPLOY_DEPENDENCY_VERSION__': deployDependencyVersion,
    };

    await copyTemplateDirectory(TEMPLATE_DIR, resolvedTargetDirectory, replacements);

    await writeWebsiteAgentMission(resolvedTargetDirectory, {
      appName: displayName,
      packageName: inferredPackageName,
      siteUrl,
      provider,
      deployProjectName,
      projectBriefContent,
    });

    await installProjectDependencies(resolvedTargetDirectory);

    await initializeGitRepository(resolvedTargetDirectory);

    let remoteConfigured = false;
    let secretConfigured = false;
    let configuredSecretCount = 0;

    if (shouldSetupGitHub && repoSlug) {
      repoSlug = await maybeCreateGitHubRepo(resolvedTargetDirectory, repoSlug, repoVisibility);
      remoteConfigured = true;

      for (const secretDefinition of deploySecretDefinitions) {
        if (!secretDefinition.value) {
          continue;
        }

        await runCommand(
          'gh',
          [
            'secret',
            'set',
            secretDefinition.name,
            '--repo',
            repoSlug,
            '--body',
            secretDefinition.value,
          ],
          { cwd: resolvedTargetDirectory },
        );
        configuredSecretCount += 1;
      }

      secretConfigured = configuredSecretCount === deploySecretDefinitions.length;
    }

    if (provider === PROVIDERS.firebase) {
      await writeFirebaseConfigFiles(resolvedTargetDirectory, deployProjectName);
    }

    await createInitialCommit(resolvedTargetDirectory);
    if (remoteConfigured) {
      await pushInitialCommit(resolvedTargetDirectory);
    }

    printNextSteps({
      targetDirectory: resolvedTargetDirectory,
      remoteConfigured,
      secretConfigured,
      repoSlug,
      provider,
      deployProjectName,
      deployAccountId,
    });

    await runWebsiteAgent({
      targetDirectory: resolvedTargetDirectory,
      codingAgent,
      appName: displayName,
      packageName: inferredPackageName,
      siteUrl,
      provider,
      deployProjectName,
      projectBriefContent,
    });
  } finally {
    if (!promptsClosed) {
      rl.close();
    }
  }
}
