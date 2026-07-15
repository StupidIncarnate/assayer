import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'or.ts'), 'utf8');
const relPath = 'src/boolean/or.ts';

const BRANCH =
  '*module*/alarmLevel/if:BinaryExpression,BinaryExpression,id:temp,GreaterThanToken,num:50,BarBarToken,id:smoke';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

describe('boolean / or — a disjunction inside an exported function', () => {
  it('VALID: {|| condition} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('or.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  // The bare `smoke` operand is a TRUTHINESS test, not an unclassifiable condition — which is what
  // gives it a derivable domain of true/false at all.
  it('VALID: {temp > 50 || smoke} => an or-tree whose bare right operand is a truthy leaf', () => {
    const result = analyzeExtractBroker({ source, relPath });
    const conditions = result.success ? result.functions.flatMap((fn) => fn.branches).map((b) => b.condition) : [];

    expect(conditions).toStrictEqual([
      {
        kind: 'or',
        left: {
          kind: 'leaf',
          id: `${BRANCH}#leaf.0`,
          operandParamName: 'temp',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 50 },
        },
        right: {
          kind: 'leaf',
          id: `${BRANCH}#leaf.1`,
          operandParamName: 'smoke',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        },
      },
    ]);
  });

  // A disjunction MIRRORS a conjunction: it holds two ways and fails one. So the fan-out lands on
  // `then` here, where `and` put it on `else`.
  it('VALID: {|| condition} => TWO cases for then (one per reason it holds), ONE for else', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      // 51 > 50 holds, so `smoke` NEVER EVALUATES and falls to fill.
      {
        reachesExit: THEN,
        arrange: [
          { param: 'temp', value: 51 },
          { param: 'smoke', value: false },
        ],
      },
      // 50 > 50 fails, so evaluation continues and `smoke` is the operand that decides.
      {
        reachesExit: THEN,
        arrange: [
          { param: 'temp', value: 50 },
          { param: 'smoke', value: true },
        ],
      },
      // Both must fail for the disjunction to fail.
      {
        reachesExit: ELSE,
        arrange: [
          { param: 'temp', value: 50 },
          { param: 'smoke', value: false },
        ],
      },
    ]);
  });
});
