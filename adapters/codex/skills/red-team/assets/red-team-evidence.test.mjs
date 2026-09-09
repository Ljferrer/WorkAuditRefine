import test from 'node:test';
import assert from 'node:assert/strict';
import { collectIssueEvidence, evidenceLinks, formatIssueEvidence } from './red-team-evidence.mjs';

const url = 'https://github.com/example/project/issues/1848';
const api = 'https://api.github.com/repos/example/project/issues/1848';
const body = 'Proposal: automatically install after building.';
const comment = { id: 41, body: 'Operator ruling: do not install; hand off the artifact.', user: { login: 'operator' },
  html_url: `${url}#issuecomment-41`, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-02T00:00:00Z' };
function fixtures({ comments = [comment], issue = {}, pages, links = {} } = {}) {
  const calls = [];
  const issueValue = { id: 123, html_url: url, body, comments: comments.length, updated_at: '2026-09-03T00:00:00Z', ...issue };
  return { calls, fetch: async address => {
    calls.push(address);
    const value = address === api ? issueValue : (pages ? pages[address] : comments);
    if (value instanceof Error) throw value;
    if (value === undefined) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(value), { headers: links[address] ? { link: links[address] } : {} });
  } };
}

test('H2 preserves body sketch and superseding operator comment with explicit precedence', async () => {
  const evidence = await collectIssueEvidence({ url, operatorLogins: ['Operator'] }, fixtures());
  assert.equal(evidence.complete, true);
  assert.equal(evidence.body, body);
  assert.equal(evidence.operatorComments[0].body, 'Operator ruling: do not install; hand off the artifact.');
  assert.equal(evidence.operatorComments[0].classification, 'unclassified operator-authored evidence');
  assert.equal(evidence.operatorComments[0].requiresInterpretation, true);
  assert.equal(evidence.comments[0].updated_at, '2026-09-02T00:00:00Z');
  assert.equal(evidence.source.id, 123);
  assert.match(evidence.source.snapshotSha256, /^[a-f0-9]{64}$/);
  assert.equal(JSON.parse(evidence.pages[1].raw)[0].body, comment.body);
  assert.match(formatIssueEvidence(evidence), /untrusted source material/);
});

test('unchanged-body control never invents an operator ruling or body amendment', async () => {
  const evidence = await collectIssueEvidence({ url, operatorLogins: ['operator'] }, fixtures({ comments: [] }));
  assert.equal(evidence.complete, true);
  assert.equal(evidence.body, body);
  assert.deepEqual(evidence.operatorComments, []);
  const unknown = await collectIssueEvidence({ url }, fixtures());
  assert.deepEqual(unknown.operatorComments, []);
  assert.equal(unknown.comments.length, 1);
});

test('all comment pages are retained and operator identity is never inferred from association', async () => {
  const first = `${api}/comments?per_page=100&page=1`;
  const second = `${api}/comments?per_page=100&page=2`;
  const f = fixtures({ issue: { comments: 2 }, pages: { [first]: [{ ...comment, user: { login: 'someone' }, author_association: 'OWNER' }],
    [second]: [{ ...comment, id: 42, html_url: `${url}#issuecomment-42`, created_at: '2026-09-04T00:00:00Z' }] },
  links: { [first]: `<${second}>; rel="next"` } });
  const evidence = await collectIssueEvidence({ url, operatorLogins: ['operator'] }, f);
  assert.equal(evidence.complete, true);
  assert.equal(evidence.comments.length, 2);
  assert.deepEqual(evidence.operatorComments.map(row => row.commentId), [42]);
  assert.deepEqual(f.calls, [api, first, second]);
});

test('inaccessible and silently truncated comment sets cannot certify completeness', async () => {
  const unavailable = await collectIssueEvidence({ url }, fixtures({ pages: {} }));
  assert.equal(unavailable.complete, false);
  assert.equal(unavailable.body, body);
  assert.ok(unavailable.gaps.some(gap => gap.code === 'source-unavailable'));
  const truncated = await collectIssueEvidence({ url }, fixtures({ issue: { comments: 2 } }));
  assert.equal(truncated.complete, false);
  assert.equal(truncated.comments.length, 1);
  assert.ok(truncated.gaps.some(gap => gap.code === 'comment-count-mismatch'));
  const marked = await collectIssueEvidence({ url }, fixtures({ comments: [{ ...comment, body_truncated: true }] }));
  assert.ok(marked.gaps.some(gap => gap.code === 'truncated-comment'));
});

test('unlisted linked artifact creates an explicit unread gap, including comment-only relative evidence', async () => {
  const evidence = await collectIssueEvidence({ url }, fixtures({ comments: [{ ...comment, body: 'See [run](docs/run.json) and https://example.org/proof.' }] }));
  assert.equal(evidence.complete, false);
  assert.deepEqual(evidence.links.map(link => [link.url, link.status]), [['docs/run.json', 'unread'], ['https://example.org/proof', 'unread']]);
  assert.equal(evidence.gaps.filter(gap => gap.code === 'linked-evidence-gap').length, 2);
});

test('read links need preserved bytes and identity; unavailable links stay visible', async () => {
  const linkedBody = '[proof](docs/proof.md)';
  const missing = await collectIssueEvidence({ url, linkedArtifacts: [{ url: 'docs/proof.md', status: 'read' }] }, fixtures({ issue: { body: linkedBody } }));
  assert.equal(missing.complete, false);
  const read = await collectIssueEvidence({ url, linkedArtifacts: [{ url: 'docs/proof.md', status: 'read', content: 'Proof transcript', identity: 'commit:abc123' }] }, fixtures({ issue: { body: linkedBody } }));
  assert.equal(read.complete, true);
  assert.equal(read.links[0].content, 'Proof transcript');
  assert.match(read.links[0].sha256, /^[a-f0-9]{64}$/);
  const unavailable = await collectIssueEvidence({ url, linkedArtifacts: [{ url: 'extra-log', status: 'unavailable', reason: 'Access denied' }] }, fixtures());
  assert.equal(unavailable.complete, false);
  assert.equal(unavailable.links[0].reason, 'Access denied');
});

test('finite pagination refuses cycles, limits, and cross-origin credential forwarding', async () => {
  const first = `${api}/comments?per_page=100&page=1`;
  for (const target of [first, 'https://attacker.invalid/comments', `${api}/other?page=2`]) {
    const f = fixtures({ links: { [first]: `<${target}>; rel="next"` } });
    const evidence = await collectIssueEvidence({ url }, f);
    assert.equal(evidence.complete, false);
    assert.equal(f.calls.length, 2);
  }
  const evidence = await collectIssueEvidence({ url }, { ...fixtures({ links: { [first]: `<${api}/comments?page=2>; rel="next"` } }), maxPages: 1 });
  assert.ok(evidence.gaps.some(gap => gap.code === 'pagination-limit'));
});

test('identity mismatch, malformed comments, repeated IDs, and advertised truncation fail closed', async () => {
  for (const config of [
    { issue: { html_url: 'https://github.com/example/else/issues/1848' } },
    { comments: [{ ...comment, body: undefined }] },
    { comments: [comment, comment] },
    { issue: { truncated: true } },
  ]) assert.equal((await collectIssueEvidence({ url }, fixtures(config))).complete, false);
});

test('source byte limit and deadline retain incomplete outcomes', async () => {
  const big = await collectIssueEvidence({ url }, { ...fixtures(), maxResponseBytes: 10 });
  assert.equal(big.complete, false);
  assert.match(big.gaps[0].detail, /byte limit/);
  const timed = await collectIssueEvidence({ url }, { fetch: async () => new Promise(() => {}), timeoutMs: 5 });
  assert.equal(timed.complete, false);
  assert.match(timed.gaps[0].detail, /timed out/);
});

test('shorthand issue and relative Markdown references are accounted for without fetching', () => {
  assert.deepEqual(evidenceLinks('See #1919 and [report](../report.json), [section](#anchor).\n[transcript]: logs/probe.txt', url),
    ['../report.json', 'logs/probe.txt', 'https://github.com/example/project/issues/1919']);
});

test('a transport that ignores cancellation cannot append evidence after timeout', async () => {
  let respond;
  const evidence = await collectIssueEvidence({ url }, { fetch: () => new Promise(resolve => { respond = resolve; }), timeoutMs: 5 });
  assert.equal(evidence.complete, false);
  respond(new Response(JSON.stringify({ id: 123, html_url: url, body, comments: 0 })));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(evidence.pages, []);
});

test('pre-cancelled external signal prevents all issue transport calls', async () => {
  const controller = new AbortController();
  controller.abort();
  const f = fixtures();
  const evidence = await collectIssueEvidence({ url }, { ...f, signal: controller.signal });
  assert.equal(evidence.complete, false);
  assert.deepEqual(f.calls, []);
  assert.equal(evidence.gaps[0].code, 'source-cancelled');
});

test('external cancellation returns without waiting for a transport that ignores its signal', { timeout: 1000 }, async () => {
  const controller = new AbortController();
  let respond;
  let transportSignal;
  const pending = collectIssueEvidence({ url }, { signal: controller.signal, timeoutMs: 300_000,
    fetch: (_url, options) => { transportSignal = options.signal; return new Promise(resolve => { respond = resolve; }); } });
  controller.abort();
  const evidence = await pending;
  assert.equal(evidence.complete, false);
  assert.equal(evidence.gaps[0].code, 'source-cancelled');
  assert.equal(transportSignal.aborted, true);
  respond(new Response(JSON.stringify({ id: 123, html_url: url, body, comments: 0 })));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(evidence.pages, []);
});

test('streaming byte limit cancels input as soon as the limit is crossed', async () => {
  let pulls = 0;
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { pulls += 1; controller.enqueue(new Uint8Array(8)); },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const evidence = await collectIssueEvidence({ url }, { maxResponseBytes: 10, fetch: async () => new Response(stream) });
  assert.equal(evidence.complete, false);
  assert.match(evidence.gaps[0].detail, /byte limit/);
  assert.equal(pulls, 2);
  assert.equal(cancelled, true);
  assert.deepEqual(evidence.pages, []);
});

test('external cancellation interrupts a stalled streaming read and preserves prior issue evidence', { timeout: 1000 }, async () => {
  const controller = new AbortController();
  let started;
  const reading = new Promise(resolve => { started = resolve; });
  let cancelled = false;
  const stream = new ReadableStream({ pull() { started(); }, cancel() { cancelled = true; } }, { highWaterMark: 0 });
  const base = fixtures();
  const pending = collectIssueEvidence({ url }, { signal: controller.signal, timeoutMs: 300_000,
    fetch: (address, options) => address === api ? base.fetch(address, options) : new Response(stream) });
  await reading;
  controller.abort();
  const evidence = await pending;
  assert.equal(evidence.complete, false);
  assert.equal(evidence.body, body);
  assert.equal(evidence.pages.length, 1);
  assert.ok(evidence.gaps.some(gap => gap.code === 'source-cancelled'));
  assert.equal(cancelled, true);
});

test('known operator measurement and suggestion remain unclassified evidence, never rulings',async()=>{
  const evidence=await collectIssueEvidence({url,operatorLogins:['operator']},fixtures({comments:[{...comment,body:'Measurement: five rounds. Perhaps try automatic installation next time?'}]}))
  assert.equal(evidence.complete,true);assert.equal(evidence.operatorRulings,undefined)
  assert.equal(evidence.operatorComments[0].precedence,undefined)
  assert.equal(evidence.operatorComments[0].classification,'unclassified operator-authored evidence')
})
test('total intake bound spans individually valid response pages',async()=>{
  const evidence=await collectIssueEvidence({url},{...fixtures(),maxResponseBytes:10000,maxTotalBytes:300})
  assert.equal(evidence.complete,false);assert.ok(evidence.gaps.some(g=>/total evidence bound/.test(g.detail)))
})

test('rejected oversized linked artifact leaves room for later small evidence',async()=>{
  const evidence=await collectIssueEvidence({url,linkedArtifacts:[{url:'large',status:'read',identity:'v1',content:'x'.repeat(3000)},{url:'small',status:'read',identity:'v1',content:'useful'}]},{...fixtures({comments:[]}),maxTotalBytes:1000})
  assert.equal(evidence.links.find(x=>x.url==='large').status,'unread');assert.equal(evidence.links.find(x=>x.url==='small').status,'read')
})
