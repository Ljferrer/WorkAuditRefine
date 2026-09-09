import { createHash } from 'node:crypto';

const sha256 = value => createHash('sha256').update(value).digest('hex');

/** Enumerate source links, including relative Markdown artifacts and shorthand issues. */
export function evidenceLinks(text, issueUrl) {
  const links = new Set();
  for (const match of text.matchAll(/\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+[^)]*)?\)/g)) links.add(match[1]);
  for (const match of text.matchAll(/^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)) links.add(match[1]);
  for (const match of text.matchAll(/https?:\/\/[^\s<>"`]+/g)) links.add(match[0].replace(/[),.;]+$/, ''));
  const repository = issueUrl.replace(/\/issues\/\d+.*$/, '');
  for (const match of text.matchAll(/(?<![\w/])#(\d+)\b/g)) links.add(`${repository}/issues/${match[1]}`);
  return [...links].filter(link => !link.startsWith('#') && link !== issueUrl);
}

function issueAddress(value) {
  const url = new URL(value);
  const match = url.pathname.match(/^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/issues\/(\d+)\/?$/);
  if (url.origin !== 'https://github.com' || !match || url.search || url.username || url.password) {
    throw new Error('Issue evidence requires an https://github.com/OWNER/REPO/issues/NUMBER URL');
  }
  return { url: `${url.origin}/${match[1]}/${match[2]}/issues/${match[3]}`, apiUrl: `https://api.github.com/repos/${match[1]}/${match[2]}/issues/${match[3]}` };
}

/**
 * Read full issue evidence. Linked artifacts are never fetched implicitly: the caller
 * supplies their preserved contents or an explicit unread/unavailable explanation.
 * All input prose is evidence, not execution authority. Operator identity is explicit.
 */
export async function collectIssueEvidence(request, {
  fetch = globalThis.fetch, maxPages = 100, timeoutMs = 30_000,
  maxResponseBytes = 8 * 1024 * 1024, maxTotalBytes = 16 * 1024 * 1024, headers = {}, signal, now = () => new Date().toISOString(),
} = {}) {
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 1000) throw new Error('maxPages must be 1–1000');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300_000) throw new Error('timeoutMs must be 1–300000');
  if (!Number.isInteger(maxResponseBytes) || maxResponseBytes < 1) throw new Error('maxResponseBytes must be positive');
  if (!Number.isInteger(maxTotalBytes) || maxTotalBytes < 1 || maxTotalBytes > 16*1024*1024) throw new Error('maxTotalBytes must be bounded to 16 MiB');
  let retainedBytes=0;
  const source = issueAddress(request.url);
  const operatorLogins = request.operatorLogins ?? [];
  const linkedArtifacts = request.linkedArtifacts ?? [];
  if (!Array.isArray(operatorLogins) || operatorLogins.some(login => typeof login !== 'string' || !login)) throw new Error('operatorLogins must be explicit login strings');
  if (!Array.isArray(linkedArtifacts)) throw new Error('linkedArtifacts must be an array');
  const result = { source, fetchedAt: now(), body: null, comments: [], operatorLogins,
    operatorComments: [], precedence: 'Explicit operator rulings in comments supersede conflicting body sketches; retain all source text. Do not infer a ruling from authorship alone.',
    links: [], pages: [], complete: false, gaps: [] };
  const gap = (code, sourceUrl, detail) => result.gaps.push({ code, source: sourceUrl, detail });
  async function read(url) {
    if (signal?.aborted) { gap('source-cancelled', url, 'Evidence intake cancelled'); return null; }
    const controller = new AbortController();
    let timer;
    let active = true;
    let reader;
    let onAbort;
    try {
      const termination = new Promise((_, reject) => {
        const stop = (message, cancelled) => {
          active = false;
          const error = new Error(message);
          if (cancelled) error.code = 'source-cancelled';
          reject(error);
          controller.abort();
          if (reader) void reader.cancel().catch(() => {});
        };
        onAbort = () => stop('Evidence intake cancelled', true);
        signal?.addEventListener('abort', onAbort, { once: true });
        timer = setTimeout(() => stop('Evidence request timed out', false), timeoutMs);
      });
      const work = (async () => {
        const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json', ...headers }, redirect: 'error', signal: controller.signal });
        if (!active) throw new Error('Evidence request already ended');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (response.url && response.url !== url) throw new Error('Unexpected source redirect');
        let raw = '';
        let bytes = 0;
        // Stream the response when available so the byte limit bounds retained memory.
        if (response.body?.getReader) {
          reader = response.body.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const part = await reader.read();
              if (part.done) break;
              bytes += part.value.byteLength;
              if (bytes + retainedBytes > maxTotalBytes) throw new Error('total evidence bound exceeded');
              if (bytes > maxResponseBytes) throw new Error('Response exceeds byte limit');
              raw += decoder.decode(part.value, { stream: true });
            }
            raw += decoder.decode();
          } finally { await reader.cancel().catch(() => {}); }
        } else {
          raw = await response.text();
          bytes=Buffer.byteLength(raw);
          if(bytes + retainedBytes > maxTotalBytes) throw new Error('total evidence bound exceeded');
          if (bytes > maxResponseBytes) throw new Error('Response exceeds byte limit');
        }
        const value = JSON.parse(raw);
        if (!active) throw new Error('Evidence request already ended');
        retainedBytes+=bytes;
        result.pages.push({ url, sha256: sha256(raw), etag: response.headers.get('etag'), raw });
        return { value, link: response.headers.get('link') };
      })();
      return await Promise.race([work, termination]);
    } catch (error) { gap(error.code === 'source-cancelled' ? error.code : 'source-unavailable', url, error.message); return null; }
    finally { active = false; clearTimeout(timer); signal?.removeEventListener('abort', onAbort); }
  }

  const issue = await read(source.apiUrl);
  if (!issue) return result;
  const record = issue.value;
  if (!record || typeof record !== 'object' || record.html_url !== source.url || !record.id
    || !Number.isInteger(record.comments) || record.comments < 0 || !(typeof record.body === 'string' || record.body === null)) {
    gap('invalid-issue', source.apiUrl, 'Issue identity, body, or advertised comment count is missing or invalid');
    return result;
  }
  result.body = record.body ?? '';
  Object.assign(source, { id: record.id, updatedAt: record.updated_at ?? null, bodySha256: sha256(result.body), expectedComments: record.comments });
  if (record.truncated === true || record.body_truncated === true) gap('truncated-issue', source.url, 'Source explicitly marks the issue as truncated');
  const commentsUrl = `${source.apiUrl}/comments`;
  let next = `${commentsUrl}?per_page=100&page=1`;
  const seenPages = new Set();
  const seenComments = new Set();
  // Fetch even when advertised count is zero, to catch stale counts or a new comment.
  while (next) {
    if (seenPages.size >= maxPages) { gap('pagination-limit', next, 'Comment pagination reached the configured page limit'); break; }
    if (seenPages.has(next)) { gap('pagination-cycle', next, 'Comment pagination repeats a page'); break; }
    seenPages.add(next);
    const page = await read(next);
    if (!page) break;
    if (!Array.isArray(page.value)) { gap('invalid-comments', next, 'Comment response is not an array'); break; }
    for (const comment of page.value) {
      if (!comment || !comment.id || typeof comment.body !== 'string' || typeof comment.user?.login !== 'string'
        || typeof comment.html_url !== 'string' || !comment.html_url.startsWith(`${source.url}#issuecomment-`)
        || typeof comment.created_at !== 'string' || !Number.isFinite(Date.parse(comment.created_at))) {
        gap('invalid-comment', next, 'A comment has missing content or source identity'); continue;
      }
      if (seenComments.has(comment.id)) { gap('duplicate-comment', comment.html_url, 'Comment appeared more than once during pagination'); continue; }
      seenComments.add(comment.id);
      result.comments.push({ ...comment, bodySha256: sha256(comment.body) });
      if (comment.truncated === true || comment.body_truncated === true) gap('truncated-comment', comment.html_url, 'Source explicitly marks the comment as truncated');
    }
    next = null;
    if (page.link) {
      const nextLinks = page.link.split(',').filter(part => /rel\s*=\s*"next"/.test(part));
      if (nextLinks.length > 1) { gap('invalid-pagination', commentsUrl, 'More than one next page'); break; }
      if (nextLinks.length) {
        const candidate = nextLinks[0].match(/<([^>]+)>/);
        try {
          const address = new URL(candidate?.[1]);
          if (address.origin !== 'https://api.github.com' || address.pathname !== new URL(commentsUrl).pathname
            || address.username || address.password || address.hash) throw new Error('Next page leaves the issue comments endpoint');
          next = address.href;
        } catch (error) { gap('invalid-pagination', commentsUrl, error.message); }
      }
    }
  }
  if (result.comments.length !== record.comments) gap('comment-count-mismatch', commentsUrl, `Expected ${record.comments} comments; retained ${result.comments.length}`);
  const operators = new Set(operatorLogins.map(login => login.toLowerCase()));
  result.operatorComments = result.comments.filter(comment => operators.has(comment.user.login.toLowerCase()))
    .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at))
    .map(comment => ({ commentId: comment.id, url: comment.html_url, author: comment.user.login, body: comment.body,
      createdAt: comment.created_at, updatedAt: comment.updated_at ?? null, classification: 'unclassified operator-authored evidence', requiresInterpretation: true }));

  const supplied = new Map();
  for (const artifact of linkedArtifacts) {
    if (!artifact || typeof artifact.url !== 'string' || supplied.has(artifact.url)) throw new Error('Linked artifacts need unique source URLs or paths');
    if (!['read', 'unread', 'unavailable'].includes(artifact.status)) throw new Error('Invalid linked artifact status');
    supplied.set(artifact.url, artifact);
  }
  const discovered = new Set(evidenceLinks(result.body, source.url));
  for (const comment of result.comments) for (const link of evidenceLinks(comment.body, source.url)) discovered.add(link);
  // Caller-declared evidence is accounted for even if not discovered by the Markdown scanner.
  for (const link of supplied.keys()) discovered.add(link);
  for (const url of discovered) {
    const artifact = supplied.get(url);
    if (artifact?.status === 'read' && typeof artifact.content === 'string' && artifact.content.length > 0 && artifact.identity) {
      const artifactBytes=Buffer.byteLength(artifact.content);
      if(retainedBytes+artifactBytes>maxTotalBytes){result.links.push({url,status:'unread',reason:'total evidence bound exceeded'});gap('linked-evidence-gap',url,'total evidence bound exceeded');continue;}
      retainedBytes+=artifactBytes;
      result.links.push({ ...artifact, sha256: sha256(artifact.content) });
    } else {
      const status = artifact?.status === 'unavailable' ? 'unavailable' : 'unread';
      const detail = artifact?.reason ?? (artifact?.status === 'read' ? 'Read claim lacks preserved content or source identity' : 'Linked artifact has not been consumed');
      result.links.push({ url, status, reason: detail });
      gap('linked-evidence-gap', url, detail);
    }
  }
  result.source.snapshotSha256 = sha256(JSON.stringify(result.pages.map(page => [page.url, page.sha256])));
  result.complete = result.gaps.length === 0;
  return result;
}

/** Role projection excludes archived transport bytes but retains complete parsed evidence. */
export function projectIssueEvidence(evidence) {
  const {pages,...parsed}=evidence;
  return parsed;
}
