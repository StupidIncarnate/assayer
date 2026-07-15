import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'and.ts'), 'utf8');
const relPath = 'src/boolean/and.ts';

const BRANCH =
  '*module*/grade/if:BinaryExpression,BinaryExpression,id:score,GreaterThanToken,num:5,AmpersandAmpersandToken,BinaryExpression,id:bonus,GreaterThanToken,num:1';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

describe('boolean / and — a conjunction inside an exported function', () => {
  it('VALID: {&& condition} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('and.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('VALID: {score > 5 && bonus > 1} => an and-tree over two independently typed leaves', () => {
    const result = analyzeExtractBroker({ source, relPath });
    const conditions = result.success ? result.functions.flatMap((fn) => fn.branches).map((b) => b.condition) : [];

    expect(conditions).toStrictEqual([
      {
        kind: 'and',
        left: {
          kind: 'leaf',
          id: `${BRANCH}#leaf.0`,
          operandParamName: 'score',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
        },
        right: {
          kind: 'leaf',
          id: `${BRANCH}#leaf.1`,
          operandParamName: 'bonus',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 1 },
        },
      },
    ]);
  });

  // The payoff, and the bug that motivated decomposition. Read as ONE opaque operand, this condition
  // was `unrecognized`, so BOTH arms derived the identical arrange `{score: 0, bonus: 0}` — meaning
  // the then-case claimed to reach an exit that `grade(0, 0)` provably cannot reach. Each case below
  // is a distinct REASON, and each one's values actually drive the flow it claims.
  it('VALID: {&& condition} => one case per CAUSE — one for then, TWO for else', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      // 6 > 5 && 2 > 1 — both hold.
      {
        reachesExit: THEN,
        arrange: [
          { param: 'score', value: 6 },
          { param: 'bonus', value: 2 },
        ],
      },
      // 5 > 5 fails, so `bonus > 1` NEVER EVALUATES — bonus is unconstrained and falls to fill.
      {
        reachesExit: ELSE,
        arrange: [
          { param: 'score', value: 5 },
          { param: 'bonus', value: 0 },
        ],
      },
      // 6 > 5 holds, so evaluation continues and 1 > 1 is the operand that decides.
      {
        reachesExit: ELSE,
        arrange: [
          { param: 'score', value: 6 },
          { param: 'bonus', value: 1 },
        ],
      },
    ]);
  });

  // A compound condition used to enrich NEITHER operand: there was no single param name to report.
  it('VALID: {&& condition} => enriches BOTH operands on the branch line', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.enrichment).toStrictEqual([
      { line: 1, symbol: 'score', typeText: 'number' },
      { line: 1, symbol: 'bonus', typeText: 'number' },
      { line: 2, symbol: 'score', typeText: 'number', range: [6, 5] },
      { line: 2, symbol: 'bonus', typeText: 'number', range: [2, 1] },
    ]);
  });
});
