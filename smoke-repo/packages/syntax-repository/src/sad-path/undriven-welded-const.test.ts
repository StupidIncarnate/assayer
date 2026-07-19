import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'undriven-welded-const.ts'), 'utf8');
const relPath = 'src/sad-path/undriven-welded-const.ts';

const BRANCH = '*module*/if:BinaryExpression,id:level,GreaterThanToken,num:5';
const THEN = `${BRANCH.replace('/if:', '/exit@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/exit@if:')}#else`;

// The reason the analysis carries, verbatim. Pinned HERE rather than left to the transformer's own
// unit test because that test authors the sentence it then asserts; this one reads what the analyzer
// actually said about a real file, which is the only way the two can disagree.
const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  'runs at import time, and every operand its top-level branching turns on is welded to a value ' +
  'written in this file. No harness closes this and no feature will — a branch with one possible ' +
  'outcome is decided here, in the source, not at run time. Read an operand from the environment ' +
  'instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X an input, ' +
  'and each arm becomes a case that sets it and imports the module fresh.';

describe('sad-path / undriven-welded-const — a module scope whose branch turns on a const welded into its own source', () => {
  // A PERMANENT dead end: `level` is welded to 7, so the `if` has one possible outcome and no input to
  // vary. No harness closes it and no feature will — this stays undriven even when the plan is fully
  // adopted.
  it('VALID: {a module scope over a welded const} => admitted as undriven, with the reason that says no feature will close it', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    // The module has no exported binding, so its label is the file basename — the reader never sees the
    // internal `*module*`, while `name` stays `*module*` to key the driven/undriven match.
    expect(analysis.undriven).toStrictEqual([
      { name: '*module*', label: 'undriven-welded-const.ts', reason: MODULE_REASON, startLine: 1, endLine: 8 },
    ]);
  });

  // WHY the admission is owed, stated as evidence: the analyzer reads both arms and derives one case
  // per exit — both arrange NOTHING, so at most one could ever execute. That is what "undriven" means
  // here, and why a run reports 0/0 rather than failing a case against correct code.
  it('VALID: {a welded operand} => both derived cases arrange nothing, so nothing chooses an arm', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesExit: THEN, arrange: [] },
      { reachesExit: ELSE, arrange: [] },
    ]);
  });

  // The span is the whole file, because that is what a module scope IS, and it is the only entry.
  it('VALID: {a module scope} => its span is the whole file, and it is the file\'s only entry', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access }))).toStrictEqual([
      { name: '*module*', access: { kind: 'module' } },
    ]);
  });

  // NOT a dark spot: the walk read this `if` and both arms perfectly. The branch is decided at
  // authoring time, not unparsed. The two admissions are opposite claims and must never merge.
  it('VALID: {a fully-understood if/else} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
