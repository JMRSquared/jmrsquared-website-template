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
const MISSION_FILE_NAME = 'mission.md';

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

## Goal

Build, polish, validate, commit, push, and ship a production-ready, highly premium customer-facing website for **${appName}** (\`${packageName}\`) in one continuous autonomous session. The live target is \`${siteUrl}\` on **${provider}** project \`${deployProjectName}\`. These sites are demo pitches for real companies that already earn trust (reviews, search traffic, local reputation) but lack a strong website. Replace the scaffold placeholder experience with an original, brand-true site that could win a design award. Do not stop at a template restyle.

After the site ships and the quality gate is **SHIP**, open a GitHub issue that drafts the polite outreach email to the company.

## Autonomy

You own this mission end to end. Never ask the user for input, confirmation, approval, clarification, or permission. Decide every product, design, content, engineering, QA, release, and outreach question yourself. Keep working until the Definition of Done below is fully met.

## Premium design

HARD REQUIREMENT. Apply the full \`premium-web-design\` skill bar with zero exceptions. The result MUST look absolutely stunning, deliver unmistakable WOW, and must NOT look AI-generated — "pretty good for AI" is a fail. Invent an original, human art-directed visual world for this brand only.

You MUST keep and evolve the baked-in stack:

1. Real 3D/WebGL via React Three Fiber + Drei (starter hero canvas is already present) — CSS decoration alone fails
2. Scroll storytelling via GSAP + ScrollTrigger (starter scroll reveal is already present) plus Motion where useful — fade-in-on-scroll alone fails
3. At least 2–3 cinematic or interactive WOW moments
4. Memorable hero composition, excellent typography, strong hierarchy

Ban AI tells: purple SaaS gradients, cream+terracotta kits, Inter/Roboto/system stacks, card/pill/badge soup, glassmorphism spam, generic AI illustration heroes, dashboard marketing layouts, fluff copy. Preserve full WOW on mobile (adapt, do not strip). Respect \`prefers-reduced-motion\`. Study the skill reference sites in a browser before designing. Follow \`AGENTS.md\`, \`.cursor/rules/\`, and yarn workflow conventions.

${briefSection}

## Operating mode

1. Read this file completely.
2. Read \`project-brief.md\` when present.
3. Read \`AGENTS.md\`, \`README.md\`, \`package.json\`, \`src/\`, and deploy/config files.
4. Follow \`premium-web-design\` and the repo hard-requirement rules.
5. Fan work out to parallel specialist roles as a coordinated team. Reconcile conflicts before merging.
6. Implement, test, fix, commit, push, re-test, and polish in loops until the site is exceptional.
7. Run the quality gate to **SHIP** (Lighthouse + screenshots + visual checklist).
8. Only then open the company outreach GitHub issue.
9. Do not wait for the user at any point.

## Required specialist roles

| Role | Ownership |
| --- | --- |
| Creative Director | Brand world, visual direction, art direction, anti-AI / anti-generic template rejection |
| Content Strategist | Information architecture, page copy, SEO metadata, CTA language |
| Lead Frontend Engineer | Domain/feature structure, React/Vite/Tailwind implementation, routing/sections |
| Motion / Interaction Engineer | Evolve R3F/Drei + GSAP/Motion storytelling; reduced-motion fallbacks |
| Visual QA / Design Critic | Stunning-craft audit, WOW audit, anti-AI-tell rejection, screenshot review, SHIP/REDO call |
| Quality Engineer | \`yarn lint\`, \`yarn typecheck\`, \`yarn build\`, \`yarn quality:gate\`, runtime smoke |
| Release Engineer | Commits, pushes to \`main\`, deploy verification |
| Outreach Writer | Final GitHub issue with company email first, then findings, then pitch email |

You remain accountable for one coherent website, a SHIP quality gate, and the outreach issue.

## Product and design requirements

- One composition in the first viewport: brand as hero-level signal, one headline, one short supporting sentence, one CTA group, one dominant full-bleed visual plane (use/evolve the 3D hero canvas).
- No dashboard feel. No card soup in the hero. No detached overlay badges/chips on hero media.
- Expressive typography. No Inter/Roboto/Arial/system default stacks unless the brief forces a brand font exception.
- Atmospheric backgrounds with depth. Avoid purple-on-white clichés, cream+terracotta template looks, and broadsheet newspaper layouts.
- Real visual anchors tied to the product/place/atmosphere. Decorative gradients alone are not enough.
- Section discipline: one job, one headline, one short supporting sentence per section.
- HARD REQUIREMENT: stunning craft + clear WOW + zero AI-template look.
- HARD REQUIREMENT: keep real 3D (R3F/Drei) and GSAP scroll storytelling. Do not strip the starter motion stack.
- HARD REQUIREMENT: keep \`DemoPreviewBanner\` and \`JmrSquaredAttribution\` with unsolicited-demo wording, https://tech.jmrsquared.com/, and tech@jmrsquared.com.
- Ship at least 2-3 intentional cinematic or interactive WOW moments. Soft fades do not count as WOW.
- Production-ready states where relevant. Accessibility and SEO as in \`AGENTS.md\`.
- Domain-driven structure under \`src/features/<feature>/\` or \`src/domains/<domain>/\`. Named exports only. \`export function Component\` and \`interface Props\` at the bottom.
- Yarn only. No placeholders, TODOs, or unfinished sections.

## Engineering loop

1. Plan architecture and visual direction.
2. Delegate independent work to specialist roles.
3. Implement substantial vertical slices.
4. Run \`yarn lint\`, \`yarn typecheck\`, and \`yarn build\`.
5. Verify desktop + mobile via \`yarn dev\` / \`yarn preview\`.
6. Fix every defect found by QA/design critique.
7. Commit and push to \`main\` regularly.
8. Re-check the deployed result when available.
9. Raise craft past "good enough".
10. Run \`yarn quality:gate\`, capture desktop/mobile screenshots into \`quality-gate/\`, complete the visual checklist, and stop at **SHIP** only.
11. Open the company outreach GitHub issue.

## Quality gate (required before outreach)

- Run \`yarn quality:gate\`.
- Save \`quality-gate/desktop.png\` and \`quality-gate/mobile.png\`.
- Complete the checklist in \`quality-gate/report.md\`.
- Decision must be **SHIP**. On **REDO**, fix and rerun. Do not open outreach on REDO.
- Commit quality-gate artifacts.

## Git and release rules

- Commit and push freely when changes are coherent and validated.
- Prefer many small milestone commits.
- Push to \`main\` so GitHub Actions can deploy.
- Final deploy convention: commit with \`:rocket: Deploy\` and push.
- Never use \`--no-verify\`, force-push to main, or destructive git resets.
- Never ask the user to commit, push, or approve.

## Final required step: company outreach GitHub issue

Only after quality gate **SHIP** and deploy push, open ONE GitHub issue using \`gh issue create\`.

Issue title:
\`Outreach draft: ${appName} pitch email\`

Issue body order:
1. **Company email** (\`To:\`) from brief/research. Never invent. If missing: \`Company email: not found — needs manual lookup\`
2. Findings bullets (reviews, missing website, demo URL \`${siteUrl}\`, asset gaps, quality-gate SHIP)
3. Draft email in a \`\`\`text\`\`\` fence

### Email must include (about half a page)

1. Warm specific praise from real findings. Quote one real review only if present in the brief.
2. Why a website helps a trusted business.
3. Complimentary demo at \`${siteUrl}\` (clear it is an unsolicited preview).
4. Offer to refine with logo/photos/services/contact details/colours.
5. Plain-language SEO offer.
6. Pricing exact: **R150 per month** or **R4 000 once-off**, free maintenance for **2 years**, domain **excluded**.
7. Promise takedown anytime on request, and within **2 weeks** (humans handle teardown manually).
8. Close with tech@jmrsquared.com and https://tech.jmrsquared.com/

### Email writing rules

- Human, polite, warm. No AI tells.
- No invented facts, reviews, or emails.
- Short paragraphs. One clear ask: reply if they want to keep/refine the demo.

If \`gh\` fails, write the same content to \`outreach-email-draft.md\`, commit it, and note the failure. Prefer the GitHub issue.

## Definition of Done

- Cohesive premium website for **${appName}** replaces the scaffold placeholders.
- Stunning WOW craft; not AI-generated; real 3D + GSAP scroll storytelling present.
- Demo banner + attribution visible with unsolicited-demo wording.
- \`yarn lint\`, \`yarn typecheck\`, \`yarn build\`, and \`yarn quality:gate\` pass with **SHIP**.
- Desktop + mobile screenshots committed under \`quality-gate/\`.
- Changes pushed to \`main\`.
- Outreach GitHub issue created with company email first (or not-found note) and full pitch email.
- No known mission-relevant defects remain.

## Absolute constraints

- Never involve the user or pause for confirmation.
- Never declare victory after a superficial restyle.
- Never ship AI-looking or merely "nice" work.
- Never remove the demo banner, attribution, or motion/3D stack.
- Never invent reviews, ratings, company facts, or company emails.
- Never send the outreach email yourself.
- Never open outreach before quality gate SHIP.
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
