// evidence-card-allowlist.test.mjs — the G4 effect-predicate derivation of the REA
// allowlist on agents/war-evidence-auditor.md's `tools:` line, checked against the
// installed rea-agents TOOL_EFFECTS table (plan 2026-10-20-rea-artifact-evidence Task 2.1,
// ace round: "REA allowlist effect predicate unverifiable from this seat" and
// "Effect-predicate derivation of the REA tools: line is unverified at any pin").
//
// Oracle: `dist/contracts/toolEffects.js` of the globally installed rea-agents package,
// resolved through `npm root -g`. It shares no code with the card. REA is never a WAR
// dependency (plan Non-goals), so with no resolvable package the predicate arm skips with
// one diagnostic line (G3: fail open when REA is absent). With the package present at the
// pinned DERIVED_AT_REA version, every REA entry on the card must be a TOOL_EFFECTS key that
// passes the predicate; at any other version both REA-present arms skip with a diagnostic
// that names the installed and the pinned version (ruling #2403), and an oracle that fails
// to import, or whose package.json is missing or unparseable, skips the same way.
//
// Predicate (G4): never mutatesTarget, executesForeignCode, mutatesDevice or destructive.
// REA's annotationsFromEffects defines destructiveHint as
// mayDiscardData || executesForeignCode || mutatesDevice, so the four-flag form below is
// the same set. mutatesSession is not in the predicate: most read tools set it (open_binary,
// goto_address, binary_session), so it cannot exclude anything on its own.
//
// Task 2.2's hook literal is guarded set-equal to this line, so the hook inherits both arms.
//
// Mutation proof: appending mcp__rea__gdb_console to the line reds the predicate arm;
// appending mcp__rea__capture_adb_screen reds the Non-goals family arm; removing
// mcp__rea__binary_session reds the presence arm.
//
// Host-write residual (ace re-entry: "Host-write and process-launch REA tools on the allowlist
// are unverified from this seat"): the predicate reads neither writesFilesystem nor
// launchesProcess, so allowlisted tools may write host paths. Since ruling #2402 the MCP hook's
// output-path check denies an `output_directory` (or `destination`) that does not carry the
// `/.claude/war/evidence/` segment (segment containment, not a `$MAIN` anchor); the predicate
// itself still reads neither flag. The card's
// `## Read-only guard contract` names the allowlisted tools whose input schema carries a
// caller-named `output_directory`. That list is a restated value, bound here: the card-local arm
// checks every named tool is on the `tools:` line; the REA-present arm extracts the names and
// deepEquals them to the TOOL_CONTRACTS entries (dist/contracts/toolContracts.js) whose input
// schema, walked through unions and effects, has an `output_directory` key. Mutation proof:
// dropping `pull_adb_file` from the card sentence reds the REA-present arm; adding
// `extract_artifact` (REA picks its own temp dir) reds it too; misspelling a name reds the
// card-local arm everywhere.
//
// Root is resolved from import.meta.url — NEVER process.cwd() (the suite's standing idiom:
// a subagent's cwd is the main repo and resets between bash calls).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CARD = join(ROOT, 'agents', 'war-evidence-auditor.md');
// The rea-agents version the allowlist was derived at (ruling #2403). The predicate arms run only
// at this version and skip with a diagnostic otherwise: a REA upgrade that adds or renames a tool
// is a re-derivation, never a silent red or a silent pass. The hook header records the same
// version behind `Derived at rea-agents: ` and evidence-presence.test.mjs asserts the two equal.
const DERIVED_AT_REA = '6.5.0';
const PREFIX = 'mcp__rea__';
const PRESENCE_TOOL = 'mcp__rea__binary_session';
// Plan Non-goals: annotate_*, set_*, capture_*, instrument_with_frida (adb writes fail the
// predicate itself through mutatesDevice).
const NON_GOALS_FAMILY = /^mcp__rea__(annotate_|set_|capture_|instrument_with_frida$)/;

function cardReaTools() {
  const line = readFileSync(CARD, 'utf8').split('\n').find((l) => l.startsWith('tools: '));
  assert.ok(line, 'agents/war-evidence-auditor.md carries a `tools: ` frontmatter line');
  return line.slice('tools: '.length).split(', ').filter((n) => n.startsWith(PREFIX));
}

// The bare tool names (no mcp__rea__ prefix) the card's host-write sentence lists, in card order.
function cardOutputDirTools() {
  const m = readFileSync(CARD, 'utf8').match(/caller-named `output_directory`: ((?:`[a-z_]+`(?:, | and )?)+)\./);
  assert.ok(m, 'agents/war-evidence-auditor.md names the caller-named `output_directory` tools');
  return [...m[1].matchAll(/`([a-z_]+)`/g)].map((x) => x[1]);
}

// Every property key reachable in a zod input schema, through unions, effects and pipes.
function schemaKeys(schema, acc = new Set()) {
  const def = schema && schema._def;
  if (!def) return acc;
  const shape = typeof def.shape === 'function' ? def.shape() : def.shape || schema.shape;
  if (shape) for (const k of Object.keys(shape)) acc.add(k);
  for (const inner of [def.innerType, def.schema, def.left, def.right, def.in, def.out]) schemaKeys(inner, acc);
  if (def.options) for (const o of def.options) schemaKeys(o, acc);
  return acc;
}

// Returns { table, version } for the installed rea-agents package, or null when it is
// not resolvable (no npm, no global root, no package). `version` is the installed package
// version, compared with DERIVED_AT_REA by the arms below; it is null when package.json is
// missing or unparseable, so the version-mismatch arm skips (ruling #2403: a broken oracle
// skips, never fails).
function resolveToolEffects() {
  let root;
  try {
    root = execFileSync('npm', ['root', '-g'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
  const pkg = join(root, 'rea-agents');
  const table = join(pkg, 'dist', 'contracts', 'toolEffects.js');
  if (!existsSync(table)) return null;
  let version = null;
  try {
    version = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')).version;
  } catch {
    version = null;
  }
  return { table, version };
}

// The REA-present arms' common gate: null when the package is missing or its version differs
// from DERIVED_AT_REA, after t.skip with a diagnostic naming both versions; else the located
// package. A dynamic import of the oracle that throws is a skip too (importOracle), never a fail.
function locateAtPinnedVersion(t, arm) {
  const located = resolveToolEffects();
  if (!located) {
    t.skip(`rea-agents not resolvable via \`npm root -g\`: ${arm} arm skipped (REA is never a WAR dependency)`);
    return null;
  }
  if (located.version !== DERIVED_AT_REA) {
    t.skip(`installed rea-agents ${located.version === null ? '(package.json unreadable)' : located.version} differs from the pinned DERIVED_AT_REA ${DERIVED_AT_REA}: ${arm} arm skipped — re-derive the allowlist at the installed version and move DERIVED_AT_REA and the hook header's \`Derived at rea-agents: \` line together`);
    return null;
  }
  return located;
}
async function importOracle(t, file, arm) {
  try {
    return await import(pathToFileURL(file).href);
  } catch (err) {
    t.skip(`rea-agents oracle ${file} failed to import (${err && err.message}): ${arm} arm skipped — re-derive the allowlist against a loadable rea-agents`);
    return null;
  }
}

test('evidence card allowlist: presence tool on the line, no Non-goals family member', () => {
  const rea = cardReaTools();
  assert.ok(rea.includes(PRESENCE_TOOL), `${PRESENCE_TOOL} must be on the card's tools: line`);
  assert.deepEqual(rea.filter((n) => NON_GOALS_FAMILY.test(n)), [], 'no Non-goals family member on the card');
  assert.equal(new Set(rea).size, rea.length, 'no duplicate REA entry on the card');
});

test('evidence card host-write list: every named output_directory tool is on the tools: line', () => {
  const rea = new Set(cardReaTools());
  const named = cardOutputDirTools();
  assert.ok(named.length > 0, 'the host-write sentence names at least one tool');
  assert.equal(new Set(named).size, named.length, 'no duplicate name in the host-write sentence');
  assert.deepEqual(named.filter((n) => !rea.has(PREFIX + n)), [], 'every named tool is an allowlist member');
});

test('evidence card host-write list: equals the allowlisted tools whose input schema has output_directory at the installed rea-agents', async (t) => {
  const located = locateAtPinnedVersion(t, 'output_directory');
  if (!located) return;
  const contracts = join(dirname(located.table), 'toolContracts.js');
  const oracle = await importOracle(t, contracts, 'output_directory');
  if (!oracle) return;
  const { TOOL_CONTRACTS } = oracle;
  const rea = new Set(cardReaTools().map((n) => n.slice(PREFIX.length)));
  const expected = TOOL_CONTRACTS.filter((c) => rea.has(c.name) && schemaKeys(c.inputSchema).has('output_directory'))
    .map((c) => c.name)
    .sort();
  t.diagnostic(`rea-agents ${located.version}: ${expected.length} allowlisted tools take output_directory`);
  assert.deepEqual([...cardOutputDirTools()].sort(), expected, `card host-write list vs TOOL_CONTRACTS at rea-agents ${located.version}`);
});

test('evidence card allowlist: every REA entry passes the G4 effect predicate at the installed rea-agents', async (t) => {
  const located = locateAtPinnedVersion(t, 'predicate');
  if (!located) return;
  const oracle = await importOracle(t, located.table, 'predicate');
  if (!oracle) return;
  const { TOOL_EFFECTS } = oracle;
  const rea = cardReaTools();
  t.diagnostic(`rea-agents ${located.version}: ${Object.keys(TOOL_EFFECTS).length} TOOL_EFFECTS keys, ${rea.length} card entries`);
  const failing = rea.filter((n) => {
    const e = TOOL_EFFECTS[n.slice(PREFIX.length)];
    return !e || e.mutatesTarget || e.executesForeignCode || e.mutatesDevice || e.mayDiscardData;
  });
  assert.deepEqual(
    failing,
    [],
    `card REA entries unknown to TOOL_EFFECTS or failing the G4 predicate at rea-agents ${located.version}`,
  );
});
