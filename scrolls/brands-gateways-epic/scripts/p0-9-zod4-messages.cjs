// Rewrites zod 3 message patterns in failing `.toThrow(/.../flags)` assertions to zod 4's exact text.
// Usage: node tmp/p0-9-a/rewrite.cjs <ward-run-json> [--apply]
// Without --apply it prints the proposed edits and leftovers and writes nothing.
const fs = require('fs');

const [runJson, mode] = process.argv.slice(2);
const apply = mode === '--apply';
const run = JSON.parse(fs.readFileSync(runJson, 'utf8'));
const failures = run.checks
  .filter((c) => c.checkType === 'unit')
  .flatMap((c) => c.projectResults.flatMap((p) => p.testFailures))
  .filter((f) => /Expected pattern: /u.test(f.message) && /Received message: "\[/u.test(f.message));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\/]/gu, '\\$&');

// Jest prints the received message as a quoted string with `\"` and `\\` escapes.
const unJestQuote = (s) => JSON.parse(s.replace(/\n/gu, '\\n'));

const edits = new Map(); // key file:line -> {file, line, oldPattern, newPattern, tests: []}
const leftovers = [];

for (const f of failures) {
  const file = f.suitePath;
  const expected = /Expected pattern: (\/.*\/[a-z]*)\n/u.exec(f.message)[1];
  const recvMatch = /Received message: ("\[[\s\S]*?\]")\n/u.exec(f.message);
  if (!recvMatch) {
    leftovers.push({ file, test: f.testName, why: 'received message not parseable' });
    continue;
  }
  const issues = JSON.parse(unJestQuote(recvMatch[1]));
  const zod4 = issues[0].message;
  // error.message is JSON.stringify(issues), so the message text appears JSON-escaped inside it.
  const inMessage = JSON.stringify(zod4).slice(1, -1);
  const escaped = escapeRegex(inMessage);
  // A plain `it` frame reads `at Object.<anonymous> (<path>:l:c)`; an `it.each` frame reads `at <path>:l:c`.
  const frames = [...f.message.matchAll(/ at (?:Object\.<anonymous> \()?(\/[^:()\s]+):(\d+):(\d+)/gu)].filter(
    (m) => m[1] === file,
  );
  if (frames.length === 0) {
    leftovers.push({ file, test: f.testName, why: 'no stack frame in the test file' });
    continue;
  }
  const line = Number(frames[frames.length - 1][2]);
  const key = `${file}:${line}`;
  const flags = /\/([a-z]*)$/u.exec(expected)[1];
  const newPattern = `/${escaped}/${flags}`;
  const prev = edits.get(key);
  if (prev && prev.newPattern !== newPattern) {
    prev.conflict = true;
    prev.tests.push(`${f.testName} -> ${newPattern}`);
    continue;
  }
  if (prev) {
    prev.tests.push(f.testName);
    continue;
  }
  edits.set(key, { file, line, oldPattern: expected, newPattern, tests: [f.testName] });
}

const out = [];
const byFile = new Map();
for (const e of edits.values()) {
  if (e.conflict) {
    leftovers.push({ file: e.file, test: e.tests.join(' | '), why: `line ${e.line}: tests on one line need different text` });
    continue;
  }
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}

let applied = 0;
for (const [file, list] of byFile) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (const e of list) {
    const text = lines[e.line - 1];
    const needle = `.toThrow(${e.oldPattern})`;
    const count = text.split(needle).length - 1;
    if (count !== 1) {
      leftovers.push({ file, test: e.tests.join(' | '), why: `line ${e.line} holds ${count} copies of ${needle}: ${text.trim()}` });
      continue;
    }
    const after = text.replace(needle, `.toThrow(${e.newPattern})`);
    out.push(`${file.replace(/^.*?packages\//u, 'packages/')}:${e.line}\n  - ${text.trim()}\n  + ${after.trim()}`);
    lines[e.line - 1] = after;
    applied += 1;
  }
  if (apply) fs.writeFileSync(file, lines.join('\n'));
}

console.log(out.join('\n'));
console.log(`\nfailing tests: ${failures.length}; edits: ${applied}; files: ${byFile.size}`);
console.log(`LEFTOVERS (${leftovers.length}):`);
for (const l of leftovers) console.log(`  ${l.file}: ${l.test}: ${l.why}`);
