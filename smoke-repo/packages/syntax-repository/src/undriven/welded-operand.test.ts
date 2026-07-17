import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'welded-operand.ts'), 'utf8');
const relPath = 'src/undriven/welded-operand.ts';

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

describe('undriven / welded-operand — a module scope whose branching turns on a value welded into its own source', () => {
  // THE admission, and the only reason this file exists. `level` is welded to 7, so the `if` has one
  // possible outcome and there is no input to vary — every derived case below arranges nothing.
  it('VALID: {a module scope over a welded const} => admitted as undriven, with the reason that says no feature will close it', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.undriven).toStrictEqual([
      { name: '*module*', reason: MODULE_REASON, startLine: 1, endLine: 8 },
    ]);
  });

  // WHY the admission is owed, stated as the evidence rather than the conclusion. The analyzer reads
  // the arms perfectly and derives one case per exit — and both arrange NOTHING, so at most one of
  // them could ever execute. Identical setups claiming different exits is what "undriven" means here,
  // and it is why a run of this file reports 0/0 instead of failing a case against correct code.
  it('VALID: {a welded operand} => both derived cases arrange nothing, so nothing chooses an arm', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesExit: THEN, arrange: [] },
      { reachesExit: ELSE, arrange: [] },
    ]);
  });

  // The span is the whole file, because that is what a module scope IS — and the app leans on exactly
  // that to decide the admission marks nothing OUT (a span covering every line shades no region).
  it('VALID: {a module scope} => its span is the whole file, and it is the file\'s only entry', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access }))).toStrictEqual([
      { name: '*module*', access: { kind: 'module' } },
    ]);
  });

  // Not a dark spot, and calling it one would be a lie about the analyzer in the opposite direction:
  // the walk read this `if` and both its arms perfectly. Nothing here is unparsed — the branch is
  // simply decided at authoring time. The two admissions are opposite claims and must never merge.
  it('VALID: {a fully-understood if/else} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
