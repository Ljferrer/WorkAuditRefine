import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import { runRedTeam } from './assets/red-team-runner.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const skill = read('SKILL.md');
const probing = read('references/probing.md');
const repair = read('references/plan-repair.md');
const host = read('references/host.md');

// These are discriminating regression scenarios, not a simulated model review.
// Keep their expected answers independent of any generated auditor response.
export const regressionScenarios = {
  H1: {
    instruction: 'The plan promises strict input validation for API and batch clients; the local cache intentionally accepts historical records. Find the omitted consumer without changing the cache contract.',
    flawed: '({api: n => Number.isInteger(n), batch: n => typeof n === "number", cache: n => typeof n === "number"})',
    repaired: '({api: n => Number.isInteger(n), batch: n => Number.isInteger(n), cache: n => typeof n === "number"})',
    expectedFinding: 'batch accepts fractional input despite the shared strict-validation obligation',
    preservedDifference: 'cache still accepts fractional historical records',
  },
  H3: {
    instruction: 'An operator changes the retry limit to two across the plan. Check the design decision, task, End state, check command and deferred validation, including paraphrases.',
    flawed: { decision: 2, task: 2, endState: 2, command: 'assert.equal(retries, 3)', backstop: 'The operator verifies three retry attempts.' },
    repaired: { decision: 2, task: 2, endState: 2, command: 'assert.equal(retries, 2)', backstop: 'The operator verifies two retry attempts.' },
    expectedFindings: ['check command retains three', 'backstop paraphrase retains three'],
  },
  H4: {
    instruction: 'An initial probe finds an omitted sibling, an independent confirmer receives its candidate, and the Lead later patches a contradicted check. Each role must receive its relevant obligations.',
    roles: { probe: 'references/probing.md', confirmation: 'references/probing.md', lead: 'references/plan-repair.md' },
    expectedFailure: 'a reference link without loading its content into the intended role is delivery failure',
  },
};

test('explicit invocation and every packaged reference resolve locally', () => {
  assert.match(skill, /^---\nname: red-team\ndescription: .+\n---/);
  const metadata = read('agents/openai.yaml');
  assert.match(metadata, /allow_implicit_invocation: false/);
  assert.match(metadata, /\$work-audit-refine-red-team:red-team/);
  for (const [, target] of skill.matchAll(/\]\((references\/[^)]+)\)/g)) {
    assert.ok(existsSync(resolve(root, target)), target);
  }
  assert.doesNotMatch([skill, probing, repair, host].join('\n'), /CLAUDE_PLUGIN_ROOT|\/Users\/|\/private\/tmp\/war-red-team/);
});

test('H1 scenario has a real omitted sibling and legitimate different control', () => {
  const flawed = vm.runInNewContext(regressionScenarios.H1.flawed);
  const fixed = vm.runInNewContext(regressionScenarios.H1.repaired);
  assert.equal(flawed.api(1.5), false);
  assert.equal(flawed.batch(1.5), true, 'independent requirement rejects this input');
  assert.equal(fixed.batch(1.5), false);
  for (const clients of [flawed, fixed]) {
    assert.equal(clients.api(2), true);
    assert.equal(clients.batch(2), true);
    assert.equal(clients.cache(1.5), true, 'do not normalize an intentionally different sibling');
  }
  assert.match(probing, /shared invariant/);
  assert.match(probing, /Intentionally different siblings/);
  assert.match(probing, /unchanged legitimate control/);
});

test('H3 scenario exposes stale enforcement and a paraphrased obligation', () => {
  const { flawed, repaired } = regressionScenarios.H3;
  assert.throws(() => vm.runInNewContext(flawed.command, { assert, retries: 2 }), assert.AssertionError);
  vm.runInNewContext(repaired.command, { assert, retries: 2 });
  assert.throws(() => vm.runInNewContext(repaired.command, { assert, retries: 3 }), assert.AssertionError);
  assert.equal(flawed.backstop.includes('three retry attempts'), true);
  assert.equal(repaired.backstop.includes('three retry attempts'), false);
  for (const surface of ['design decision', 'owning task', 'End state', 'check command', 'backstop', 'paraphrases']) {
    assert.ok(repair.includes(surface), surface);
  }
});

test('H4 routing identifies role-specific references and load triggers', () => {
  assert.match(skill, /Read \[references\/probing.md\].*before deriving/);
  assert.match(skill, /read \[references\/plan-repair.md\].*before the first patch/);
  assert.match(probing, /delivered in full to initial probes and independent confirmers/);
  assert.match(repair, /Lead guidance, not an auditor role/);
  for (const reference of Object.values(regressionScenarios.H4.roles)) assert.ok(read(reference).length > 100);
  // Runtime tests additionally inspect actual launched prompts. This test proves
  // routing instructions exist, not that a model obeyed them or a host ran them.
});

test('H4 full guidance reaches initial and independent confirmation launches', async () => {
  const temp = realpathSync(mkdtempSync(resolve(tmpdir(), 'red-team-guidance-')));
  try {
    const repository = resolve(temp, 'repo');
    mkdirSync(repository);
    const git = (...args) => execFileSync('git', ['-C', repository, ...args], { stdio: 'pipe' });
    git('init');
    writeFileSync(resolve(repository, 'plan.md'), '# Sibling validation plan\n' + regressionScenarios.H1.instruction + '\n');
    git('add', 'plan.md');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'fixture');
    const launches = [];
    const result = await runRedTeam({
      repository, planFile: resolve(repository, 'plan.md'), evidenceDir: resolve(temp, 'evidence'),
      profile: { model: 'gpt-5.6-sol', effort: 'medium' }, retries: 0,
      probes: [{ name: 'sibling-validation', technique: 'analyzed', instructions: regressionScenarios.H1.instruction }],
    }, {
      codexPath: process.execPath,
      discover: async () => ({ 'gpt-5.6-sol': ['medium'] }),
      dispatch: async ({ prompt, scope, probe, confirmation }) => {
        launches.push({ prompt, confirmation });
        const common = {
          read_anchor: { resolved_path: scope.planFile, plan_sha256: scope.planSha256, target_revision: scope.revision },
          evidence: 'Offline fixture injection; no model behavior observed.',
        };
        return { result: confirmation ? { ...common, reproduced: true, note: 'Seeded fixture candidate retained.' } : {
          ...common, probe: probe.name, technique: probe.technique, status: 'fail',
          findings: [{ severity: 'Major', claim: 'Both clients validate integers', reality: regressionScenarios.H1.expectedFinding,
            evidence: 'H1 deterministic fixture: batch(1.5) returns true.', planRef: 'Sibling validation plan' }],
        } };
      },
    });
    assert.deepEqual(launches.map(x => x.confirmation), [false, true]);
    for (const launch of launches) {
      assert.ok(launch.prompt.includes(probing), 'reference must be fully delivered, not just linked');
      assert.equal(launch.prompt.includes(repair), false, 'Lead repair authority must not be seat guidance');
    }
    assert.equal(result.final.verdict, 'BLOCKED');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('evidence and repair guidance preserve initial attempts and coverage authority', () => {
  assert.match(skill, /full body and all comments/);
  assert.match(skill, /later explicit decisions over contradicted body text/);
  assert.match(skill, /every linked evidence artifact/);
  assert.match(probing, /confirmation transport\/schema failure means missing confirmation coverage/);
  assert.match(repair, /Never edit initial-gate-input\/output or raw attempt files in place/);
  assert.match(repair, /`fingerprint`, `expected`/);
  assert.match(repair, /`adjudicated: true`/);
  for (const verdict of ['CLEARED', 'CLEARED-WITH-NOTES', 'ADJUDICATED', 'BLOCKED', 'INCOMPLETE']) assert.ok(skill.includes('`' + verdict + '`'));
});

test('host guidance does not conflate fixtures, installation, or independent review', () => {
  assert.match(host, /--list-profiles/);
  assert.match(host, /sandbox_permissions: "require_escalated"/);
  assert.match(host, /do not retry with broader permissions/);
  assert.match(host, /Offline fixtures and a package load check establish local wiring only/);
  assert.match(host, /operator-directed checkpoints/);
});
