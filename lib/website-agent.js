import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';

export const CODING_AGENTS = {
  agent: 'agent',
  claude: 'claude',
  pi: 'pi',
  codex: 'codex',
};

const DEFAULT_CODING_AGENT = CODING_AGENTS.agent;
const MISSION_FILE_NAME = 'agent-mission.md';

const AGENT_LAUNCHERS = {
  [CODING_AGENTS.agent]: (missionFileName) => ({
    command: 'agent',
    args: [
      '--yolo',
      '--trust',
      '--workspace',
      '.',
      `Read ${missionFileName} end to end and execute the full mission now. Do not ask questions. Begin immediately.`,
    ],
  }),
  [CODING_AGENTS.claude]: (missionFileName) => ({
    command: 'claude',
    args: [
      '--dangerously-skip-permissions',
      `Read ${missionFileName} end to end and execute the full mission now. Do not ask questions. Begin immediately.`,
    ],
  }),
  [CODING_AGENTS.pi]: (missionFileName) => ({
    command: 'pi',
    args: [
      '--approve',
      `@${missionFileName}`,
      'Execute the full mission now. Do not ask questions. Begin immediately.',
    ],
  }),
  [CODING_AGENTS.codex]: (missionFileName) => ({
    command: 'codex',
    args: [
      '--dangerously-bypass-approvals-and-sandbox',
      '--ask-for-approval',
      'never',
      '--sandbox',
      'danger-full-access',
      '-C',
      '.',
      `Read ${missionFileName} end to end and execute the full mission now. Do not ask questions. Begin immediately.`,
    ],
  }),
};

function commandExists(command) {
  return spawnSync('sh', ['-lc', `command -v ${command} >/dev/null 2>&1`], {
    stdio: 'ignore',
  }).status === 0;
}

function runCommand(command, args, options = {}) {
  const { cwd = process.cwd() } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: 'inherit',
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

export function normalizeCodingAgent(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) {
    return DEFAULT_CODING_AGENT;
  }

  if (CODING_AGENTS[normalized]) {
    return CODING_AGENTS[normalized];
  }

  throw new Error('Invalid coding agent. Use "claude", "pi", "codex", or "agent".');
}

export async function promptCodingAgent(rl, defaultValue = DEFAULT_CODING_AGENT) {
  const answer = (
    await rl.question(`Coding agent [claude/pi/codex/agent] (${defaultValue}): `)
  ).trim();

  if (!answer) {
    return defaultValue;
  }

  return normalizeCodingAgent(answer);
}

export function buildAgentLaunchSpec(codingAgent) {
  const launcher = AGENT_LAUNCHERS[codingAgent];

  if (!launcher) {
    throw new Error(`Unsupported coding agent: ${codingAgent}`);
  }

  return launcher(MISSION_FILE_NAME);
}

export function formatAgentCommand(codingAgent, targetDirectory) {
  const { command, args } = buildAgentLaunchSpec(codingAgent);
  const quotedArgs = args
    .map((argument) => {
      if (/[\s"'`$\\]/.test(argument)) {
        return `'${argument.replaceAll("'", `'\\''`)}'`;
      }

      return argument;
    })
    .join(' ');

  return `cd '${targetDirectory}' && ${command} ${quotedArgs}`;
}

function buildProjectBriefSection(projectBriefContent) {
  const brief = String(projectBriefContent || '').trim();

  if (!brief) {
    return [
      '## Project brief',
      '',
      'No project brief was supplied. Infer a distinctive, premium brand and complete site content from the app name, repository context, and industry cues in the scaffold. Commit to one strong creative direction and execute it fully.',
      '',
    ].join('\n');
  }

  return ['## Project brief', '', '```md', brief, '```', ''].join('\n');
}

export function buildWebsiteAgentMission({
  appName,
  packageName,
  siteUrl,
  provider,
  deployProjectName,
  projectBriefContent,
}) {
  const briefSection = buildProjectBriefSection(projectBriefContent);

  return `# Autonomous premium website mission

/goal
Build, polish, validate, commit, push, and ship a production-ready, highly premium customer-facing website for **${appName}** (\`${packageName}\`) in one continuous autonomous session. The live target is \`${siteUrl}\` on **${provider}** project \`${deployProjectName}\`. Replace the scaffold placeholder experience with an original, brand-true site that could win a design award. Do not stop at a template restyle.

/agents-execute
You own this mission end to end. Never ask the user for input, confirmation, approval, clarification, or permission. Decide every product, design, content, engineering, QA, and release question yourself. Keep working until the Definition of Done below is fully met.

/premium-web-design
Apply the full \`premium-web-design\` skill bar. This is a customer-facing marketing / brand website. Invent an original visual direction appropriate to the brand. Ship scroll storytelling, intentional motion, memorable hero composition, excellent typography, strong hierarchy, and real WOW factor. Preserve mobile-first excellence. Respect \`prefers-reduced-motion\`. Follow the repo rules in \`CLAUDE.md\`, \`.cursor/rules/\`, and yarn workflow conventions.

${briefSection}

## Operating mode

1. Read this file completely.
2. Read \`project-brief.md\` when present.
3. Read \`CLAUDE.md\`, \`README.md\`, \`package.json\`, \`src/\`, and deploy/config files.
4. Invoke and follow \`/premium-web-design\` and \`/agents-execute\` as the governing skills for the session.
5. Fan work out to parallel subagents as a coordinated team. Reconcile conflicts before merging. Never ship contradictory edits from two agents.
6. Implement, test, fix, commit, push, re-test, and polish in loops until the site is exceptional.
7. Do not wait for the user at any point.

## Required subagent team

Spawn distinct subagents (or sequential specialist roles if the harness cannot parallelize) and keep them collaborating until done:

| Role | Ownership |
| --- | --- |
| Creative Director | Brand world, visual direction, art direction, anti-generic checks |
| Content Strategist | Information architecture, page copy, SEO metadata, CTA language |
| Lead Frontend Engineer | Domain/feature structure, React/Vite/Tailwind implementation, routing/sections |
| Motion / Interaction Engineer | Scroll storytelling, micro-interactions, cinematic transitions, reduced-motion fallbacks |
| Visual QA / Design Critic | Composition, spacing, typography, contrast, mobile/desktop polish, WOW-factor audit |
| Quality Engineer | \`yarn lint\`, \`yarn typecheck\`, \`yarn build\`, runtime smoke via \`yarn dev\` / preview, a11y checks |
| Release Engineer | Meaningful git commits, pushes to \`main\`, deploy verification, secret/workflow awareness |

The primary agent is the tech lead and integrator. Subagents may specialize, but you remain accountable for one coherent website.

## Product and design requirements

- One composition in the first viewport: brand as hero-level signal, one headline, one short supporting sentence, one CTA group, one dominant full-bleed visual plane.
- No dashboard feel. No card soup in the hero. No detached overlay badges/chips on hero media.
- Expressive typography. No Inter/Roboto/Arial/system default stacks unless the brief forces a brand font exception.
- Atmospheric backgrounds with depth. Avoid purple-on-white clichés, cream+terracotta template looks, and broadsheet newspaper layouts.
- Real visual anchors tied to the product/place/atmosphere. Decorative gradients alone are not enough.
- Section discipline: one job, one headline, one short supporting sentence per section.
- Ship at least 2-3 intentional motion moments with purpose, not noise.
- Production-ready states: loading, empty, error, and edge cases where relevant.
- Accessibility: semantic HTML, one \`h1\`, meaningful alt text, keyboard focus, WCAG AA contrast.
- SEO: unique title (<60), description (<160), Open Graph, Twitter cards, canonical, theme-color, JSON-LD, robots/sitemap as appropriate.
- Domain-driven structure under \`src/features/<feature>/\` or \`src/domains/<domain>/\` with shared code in \`src/shared/\`. Named exports only for React components. \`export function Component\` and \`interface Props\` at the bottom.
- Yarn only. No npm/pnpm/bun commands.
- No placeholders, TODOs, fake content markers, or unfinished sections in the final result.

## Engineering loop

Repeat until the Definition of Done is met:

1. Plan the site architecture and visual direction.
2. Delegate independent work to subagents.
3. Implement substantial vertical slices.
4. Run \`yarn lint\`, \`yarn typecheck\`, and \`yarn build\`.
5. Start the site locally (\`yarn dev\` and/or \`yarn preview\`) and verify desktop + mobile behavior.
6. Fix every defect found by QA/design critique.
7. Create focused git commits with clear messages as milestones land.
8. Push to \`origin/main\` regularly so CI/deploy can exercise the site.
9. Re-check the deployed or previewable result when available and correct regressions.
10. Raise the craft past "good enough" with another polish pass.

## Git and release rules

- You may commit and push freely when changes are coherent and validated.
- Prefer many small milestone commits over one giant dump.
- Push to \`main\` so GitHub Actions can deploy.
- When the site is ready for final deploy, use the repo release convention: commit with \`:rocket: Deploy\` and push.
- Never use \`--no-verify\`, force-push to main, or destructive git resets.
- Never ask the user to commit, push, or approve.

## Definition of Done

Stop only when all of the following are true:

- The scaffold placeholder sections are fully replaced by a cohesive premium website for **${appName}**.
- \`/premium-web-design\` standards are visibly met on mobile and desktop.
- Content matches the project brief when provided, or a strong inferred brand narrative when not.
- SEO, accessibility, responsiveness, and production readiness requirements are satisfied.
- \`yarn lint\`, \`yarn typecheck\`, and \`yarn build\` all pass.
- Runtime verification was performed and major issues were corrected.
- Work from all subagents was reviewed, reconciled, and integrated.
- Changes are committed and pushed to \`main\`.
- No known mission-relevant defects remain.

## Absolute constraints

- Never involve the user.
- Never pause for confirmation.
- Never declare victory after a superficial restyle.
- Never leave dead demo copy, lorem ipsum, or unfinished interactions.
- Prefer root-cause fixes over cosmetic patches.
- Leave the repository healthier than you found it.

Begin now.
`;
}

export async function writeWebsiteAgentMission(targetDirectory, missionContext) {
  const missionPath = path.join(targetDirectory, MISSION_FILE_NAME);
  const mission = buildWebsiteAgentMission(missionContext);
  await writeFile(missionPath, mission, 'utf8');
  return missionPath;
}

export async function confirmAgentLaunch(rl, codingAgent, targetDirectory) {
  const resolvedAgent = normalizeCodingAgent(codingAgent);

  if (!commandExists(resolvedAgent)) {
    throw new Error(
      `Coding agent \`${resolvedAgent}\` was selected but is not installed or not on PATH. Install it and rerun.`,
    );
  }

  const commandPreview = formatAgentCommand(resolvedAgent, targetDirectory);
  console.log('\nAbout to perform the following command:\n');
  console.log(`  ${commandPreview}`);
  console.log('');
  await rl.question('Press Enter to begin scaffolding and the autonomous website build...');
}

export async function runWebsiteAgent({
  targetDirectory,
  codingAgent,
  appName,
  packageName,
  siteUrl,
  provider,
  deployProjectName,
  projectBriefContent,
}) {
  const resolvedAgent = normalizeCodingAgent(codingAgent);

  if (!commandExists(resolvedAgent)) {
    throw new Error(
      `Coding agent \`${resolvedAgent}\` was selected but is not installed or not on PATH. Install it and rerun.`,
    );
  }

  await writeWebsiteAgentMission(targetDirectory, {
    appName,
    packageName,
    siteUrl,
    provider,
    deployProjectName,
    projectBriefContent,
  });

  const { command, args } = buildAgentLaunchSpec(resolvedAgent);

  console.log('\nStarting autonomous website build. This can run for a long time.\n');

  try {
    await runCommand(command, args, { cwd: targetDirectory });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to run coding agent \`${resolvedAgent}\`: ${message}`);
  }
}
