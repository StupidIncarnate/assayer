import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'const-array-branch.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/const-array-branch/const-array-branch.ts';

// The reason the analysis carries, verbatim — the array twin of `welded-const`. Pinned HERE rather than
// left to the transformer's own unit test because that test authors the sentence it then asserts; this
// one reads what the analyzer actually said about a real file, the only way the two can disagree.
const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  'runs at import time, and every operand its top-level branching turns on is welded to a value ' +
  'written in this file. No harness closes this and no feature will — a branch with one possible ' +
  'outcome is decided here, in the source, not at run time. Read an operand from the environment ' +
  'instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X an input, ' +
  'and each arm becomes a case that sets it and imports the module fresh.';

describe('undriven / const-array-branch — a module scope whose branch turns on a welded const array', () => {
  // The operand `items` reads as an ARRAY of number and the branch as a `length-gt` predicate, but
  // `items` is a module CONST welded to `[1, 2, 3]`, not a param — so there is no input to vary. An
  // array PARAM would fan out over cardinality (empty / one / many); a welded const array has one fixed
  // value and no cardinality to sweep, so the `if` has one possible outcome. The branch and both
  // implicit exits are read perfectly, yet `derive-cases` emits NO case — nothing can steer which arm
  // runs — and the whole module scope is admitted UNDRIVEN. A PERMANENT dead end: no harness closes it
  // and no feature will.
  it('VALID: {const items = [1, 2, 3]; if (items.length > 2) {…} else {…}} => module entry, one if branch on the array length, two implicit exits, no case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: '*module*',
          scopePath: ['*module*'],
          params: [],
          returnType: { kind: 'unknown', text: 'void' },
          line: 1,
          access: { kind: 'module' },
        },
        branches: [
          {
            coverageId: '*module*/if:BinaryExpression,PropertyAccessExpression,id:items,id:length,GreaterThanToken,num:2',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: '*module*/if:BinaryExpression,PropertyAccessExpression,id:items,id:length,GreaterThanToken,num:2#leaf',
              operandParamName: 'items',
              operandType: { kind: 'array', element: { kind: 'number' } },
              predicate: { kind: 'length-gt', literal: 2 },
            },
            startLine: 3,
            endLine: 7,
          },
        ],
        exits: [
          {
            coverageId: '*module*/exit@if:BinaryExpression,PropertyAccessExpression,id:items,id:length,GreaterThanToken,num:2#then',
            kind: 'implicit',
            guardPath: [
              {
                branchCoverageId: '*module*/if:BinaryExpression,PropertyAccessExpression,id:items,id:length,GreaterThanToken,num:2',
                arm: 'then',
              },
            ],
            line: 4,
          },
          {
            coverageId: '*module*/exit@if:BinaryExpression,PropertyAccessExpression,id:items,id:length,GreaterThanToken,num:2#else',
            kind: 'implicit',
            guardPath: [
              {
                branchCoverageId: '*module*/if:BinaryExpression,PropertyAccessExpression,id:items,id:length,GreaterThanToken,num:2',
                arm: 'else',
              },
            ],
            line: 6,
          },
        ],
        cases: [],
      },
    ]);
  });

  // The module scope is admitted UNDRIVEN with the verbatim reason that says no feature will close it.
  // The walk read the `if` and both arms perfectly, so nothing is a dark spot — the two admissions are
  // opposite claims and never merge. No OBJECT shape is declared, and an unreachable-exit lint would
  // need contradicting guards, so neither channel fires.
  it('VALID: {a welded const array at module scope} => admitted undriven with the verbatim reason, no declared types, no dark spots, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({
      declaredTypes: [],
      darkSpots: [],
      undriven: [{ name: '*module*', reason: MODULE_REASON, startLine: 1, endLine: 8 }],
      lints: [],
    });
  });
});
