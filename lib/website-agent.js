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

There is no time pressure. Take as long as the craft needs — an hour or more of building, scrolling, reviewing, and rebuilding is normal and expected for one demo. Run several review-and-fix passes before you touch the quality gate. Shipping early at \`good enough\` is a worse outcome than taking longer and shipping something stunning. Never trade quality for speed, and never stop at the first build that renders.

## Premium design

HARD REQUIREMENT. Apply the full \`premium-web-design\` skill bar with zero exceptions. The result MUST look absolutely stunning, deliver unmistakable WOW, and must NOT look AI-generated — "pretty good for AI" is a fail. Compose an original brand skin on studied craft components only.

You MUST:

0. Study the skill reference sites in a **real browser**, then publish a **Reference Study Board** (≥10 attributed craft items, prefer ≥4 source URLs) **before any design or code**. Soft inspiration without a board fails. Compose every major section from board rows. End with a Verify board pass marking each item \`SHIPPED\`.
1. Build real 3D/WebGL via React Three Fiber + Drei (installed; the site ships blank, so the canvas is yours to create) — CSS decoration alone fails
2. Build scroll storytelling via GSAP + ScrollTrigger (installed; no starter sequences ship, so pin/scrub/parallax is yours to author) plus Motion where useful — fade-in-on-scroll alone fails
3. Ship at least 2–3 cinematic or interactive WOW moments that appear on the board
4. Memorable hero composition, excellent typography, strong hierarchy
5. Author the design tokens in \`src/shared/tokens/theme.css\`. They ship as deliberate monochrome placeholders with unset font families; shipping on those defaults is a REDO. Load real brand faces through the prepared \`<link>\` slots in \`index.html\`, then point \`--font-display\` and \`--font-body\` at them.

Reference sites are look-and-feel sources, not content sources. Transplant the experience and rebuild it in this client's world: a restaurant site may take igloo.inc's scroll-driven hero journey wholesale — same pacing, same camera behaviour, same reveal structure — with every asset, colour, word, and 3D subject swapped for that restaurant. Keep the feel, replace the substance. Lifting a reference's copy, logo, or literal subject matter is theft; lifting its craft is the assignment.

Ban AI tells: purple SaaS gradients, cream+terracotta kits, Inter/Roboto/system stacks, card/pill/badge soup, glassmorphism spam, generic AI illustration heroes, dashboard marketing layouts, fluff copy, orphan sections with no board citation. Preserve full WOW on mobile (adapt, do not strip). Respect \`prefers-reduced-motion\`. Follow \`AGENTS.md\`, \`.cursor/rules/\`, and yarn workflow conventions.

## Imagery and assets

Real visual anchors are mandatory. Source transparent cutout PNGs (products, food, people, objects, signage) with the \`pngimg-assets\` skill. Do not invent placeholders, hotlink remote URLs, or fall back to generic AI illustration.

\`\`\`bash
SKILL=/Users/lavhe/CODE/jmrsquared-skills/skills/pngimg-assets/scripts/pngimg.sh
"$SKILL" search "coffee beans" --limit 10
"$SKILL" download "coffee beans" --index 2 --out public/images
\`\`\`

- Licence is CC BY-NC 4.0. Allowed on this free unsolicited demo while it carries \`DemoPreviewBanner\` + \`JmrSquaredAttribution\`. Write a \`CREDITS.md\` entry with the source URL and https://pngimg.com for every shipped asset. If the company converts to a paying client, every pngimg asset must be replaced first.
- Search first and pick deliberately. Query two or three nouns, filename style, not a sentence. Never blind \`--all\` on a vague query.
- Run \`file <path>\` after each download; pngimg mixes 200px thumbnails into full-res sets. Reject anything undersized for its placement.
- Store under \`public/images/\`, optimise before commit, keep LCP under 2.5s.
- A cutout supports the composition, it does not replace it. A subject floated on a gradient is still an AI tell.

${briefSection}

## Mobile-first (HARD REQUIREMENT)

Visitors arrive on a phone from a maps listing or a search result. The phone view is the real product; desktop is secondary.

- Build the mobile layout first, then scale up. Never design desktop and squeeze it down.
- Keep the WOW on mobile. Cap complexity (fewer particles, lower DPR, simpler camera path) but never fall back to a flat static page.
- Verify 360x800, 390x844, 768x1024, and 1440x900 by scrolling the full page at each.
- No horizontal overflow at any width. Body copy at 16px or larger. Tap targets at least 44x44px with real spacing.
- Use \`dvh\` rather than \`vh\` for full-height sections so the mobile URL bar does not clip the hero.
- Throttle and check the 3D canvas. Below roughly 30fps, reduce the scene until it holds. Never ship a stuttering hero.
- The quality gate runs mobile Lighthouse. A desktop-only pass is not a pass.

## Conversion (HARD REQUIREMENT)

Beautiful with no clear next step is a fail.

- Decide the single primary action from what this business actually sells, then design the page around it. Call now for a plumber or locksmith. Book a table for a restaurant. WhatsApp for a salon or small trade. Directions for a walk-in shop. Request a quote for a contractor. Order for a takeaway.
- The primary CTA must be reachable within one thumb movement at any scroll position on mobile. Pick the pattern from the design; a persistent bar or dock is usually right.
- Every CTA uses a real mechanism: \`tel:\`, \`https://wa.me/<number>\`, a maps deep link, a mailto, or a real booking URL. No dead buttons, no \`href="#"\`, no fake forms.
- Label the outcome: "Call the shop", "WhatsApp us", "Book a table". Never "Learn more", "Get started", or "Click here".
- Contact details, address, and hours findable without scrolling the whole page, and identical to the JSON-LD.
- Unknown detail becomes a clearly-labelled placeholder plus a line in the outreach issue asking the owner to confirm. Never invent a phone number or address.

## Business content model and structured data

- Extend \`src/shared/config/site.ts\` into a typed model of the real business before writing sections: contact channels, address, hours, services or menu, service area, socials, credentials. Shape it around this business, not a generic schema.
- One source of truth. Section copy, contact UI, and JSON-LD all read from it. Never hardcode the same phone number in three components.
- Author the JSON-LD in \`index.html\` for the real business. The shipped \`WebSite\` stub is a starting point, not an answer. A physical local business takes \`LocalBusiness\` or the closest subtype (\`Restaurant\`, \`HairSalon\`, \`BarOrPub\`, \`Plumber\`, \`AutoRepair\`, \`LodgingBusiness\`) with \`name\`, \`url\`, \`image\`, \`telephone\`, \`address\`, \`geo\`, \`openingHoursSpecification\`, \`priceRange\`, \`areaServed\`, and \`sameAs\`.
- Fill \`public/robots.txt\`, \`public/sitemap.xml\`, \`public/favicon.svg\`, and a real 1200x630 \`og-image.png\`. All four ship as placeholders.
- Assert only verified facts. Omit a field rather than guess it. Never invent ratings, reviews, addresses, coordinates, or hours.

## Operating mode

1. Read this file completely.
2. Read \`project-brief.md\` when present.
3. Read \`AGENTS.md\`, \`README.md\`, \`package.json\`, \`src/\`, and deploy/config files.
4. Follow \`premium-web-design\` and the repo hard-requirement rules, including the Reference Study Board gate before coding.
5. Fan work out to parallel specialist roles as a coordinated team. Reconcile conflicts before merging.
6. Implement, test, fix, commit, push, re-test, and polish in loops until the site is exceptional.
7. Run the quality gate to **SHIP** (Lighthouse + screenshots + visual checklist).
8. Only then open the company outreach GitHub issue.
9. Do not wait for the user at any point.

## Required specialist roles

| Role | Ownership |
| --- | --- |
| Creative Director | Brand world, visual direction, art direction, imagery sourcing via \`pngimg-assets\`, anti-AI / anti-generic template rejection |
| Content Strategist | Information architecture, page copy, SEO metadata, CTA language |
| Lead Frontend Engineer | Domain/feature structure, React/Vite/Tailwind implementation, routing/sections |
| Motion / Interaction Engineer | Evolve R3F/Drei + GSAP/Motion storytelling; reduced-motion fallbacks |
| Visual QA / Design Critic | Stunning-craft audit, WOW audit, anti-AI-tell rejection, screenshot review, SHIP/REDO call |
| Quality Engineer | \`yarn lint\`, \`yarn typecheck\`, \`yarn build\`, \`yarn quality:gate\`, runtime smoke |
| Release Engineer | Commits, pushes to \`main\`, deploy verification |
| Outreach Writer | Final GitHub issue with company email first, then findings, then pitch email |

You remain accountable for one coherent website, a SHIP quality gate, and the outreach issue.

## Product and design requirements

- One composition in the first viewport: brand as hero-level signal, one headline, one short supporting sentence, one CTA group, one dominant full-bleed visual plane (build a 3D hero canvas).
- No dashboard feel. No card soup in the hero. No detached overlay badges/chips on hero media.
- Expressive typography. No Inter/Roboto/Arial/system default stacks unless the brief forces a brand font exception.
- Atmospheric backgrounds with depth. Avoid purple-on-white clichés, cream+terracotta template looks, and broadsheet newspaper layouts.
- Real visual anchors tied to the product/place/atmosphere. Decorative gradients alone are not enough. Pull cutout imagery with \`pngimg-assets\` and credit it in \`CREDITS.md\`.
- Section discipline: one job, one headline, one short supporting sentence per section.
- HARD REQUIREMENT: stunning craft + clear WOW + zero AI-template look.
- HARD REQUIREMENT: ship real 3D (R3F/Drei) and GSAP scroll storytelling. The motion stack is installed but unused; build with it, never remove it from \`package.json\`.
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
- Every third-party image licence-cleared, optimised, and credited in \`CREDITS.md\`.
- Design tokens authored; no monochrome placeholder ramp and no unset font family remains.
- Real brand fonts loaded and preconnected in \`index.html\`.
- JSON-LD authored for the real business and validated; \`robots.txt\`, \`sitemap.xml\`, favicon, and og-image replaced.
- Primary CTA works on a real mechanism and is reachable in one thumb movement at every scroll position on mobile.
- Mobile Lighthouse passes alongside desktop; no horizontal overflow at 360px.
- Changes pushed to \`main\`.
- Outreach GitHub issue created with company email first (or not-found note) and full pitch email.
- No known mission-relevant defects remain.

## Absolute constraints

- Never involve the user or pause for confirmation.
- Never declare victory after a superficial restyle.
- Never rush. Time spent reviewing and rebuilding is the job, not overhead.
- Never ship the template's placeholder tokens, fonts, favicon, og-image, robots, sitemap, or JSON-LD stub.
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
