import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'mixed.ts'), 'utf8');
const relPath = 'src/boolean/mixed.ts';

const BRANCH =
  '*module*/route/if:BinaryExpression,id:admin,AmpersandAmpersandToken,BinaryExpression,BinaryExpression,id:level,GreaterThanToken,num:3,BarBarToken,id:owner';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

describe('boolean / mixed — nested connectives inside an exported function', () => {
  it('VALID: {admin && (level > 3 || owner)} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('mixed.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  // The load-bearing property: THREE leaves yield FOUR cases, not eight. Short-circuiting keeps
  // cause enumeration linear (MC/DC's n+1), which is what makes exhaustive derivation affordable at
  // all. If this ever grows exponentially, the whole approach stops scaling.
  it('VALID: {three leaves} => FOUR cases, one per cause — linear, not 2^n', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      // admin holds, 4 > 3 holds — `owner` never evaluates.
      {
        reachesExit: THEN,
        arrange: [
          { param: 'admin', value: true },
          { param: 'level', value: 4 },
          { param: 'owner', value: false },
        ],
      },
      // admin holds, 3 > 3 fails, so `owner` decides.
      {
        reachesExit: THEN,
        arrange: [
          { param: 'admin', value: true },
          { param: 'level', value: 3 },
          { param: 'owner', value: true },
        ],
      },
      // admin fails — the ENTIRE parenthesized disjunction never evaluates, so neither operand is
      // constrained.
      {
        reachesExit: ELSE,
        arrange: [
          { param: 'admin', value: false },
          { param: 'level', value: 0 },
          { param: 'owner', value: false },
        ],
      },
      // admin holds, and both disjuncts fail.
      {
        reachesExit: ELSE,
        arrange: [
          { param: 'admin', value: true },
          { param: 'level', value: 3 },
          { param: 'owner', value: false },
        ],
      },
    ]);
  });

  // Parens are formatting, so they must not reach identity: the nested leaves key on their POSITION
  // in the tree, and `project-node` collapses the ParenthesizedExpression out of the branch ID.
  it('VALID: {parenthesized sub-expression} => leaves key on tree position, parens invisible', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });
    const enrichment = analysis.enrichment.filter((entry) => entry.line === 2);

    expect(enrichment).toStrictEqual([
      { line: 2, symbol: 'admin', typeText: 'boolean', range: [true, false] },
      { line: 2, symbol: 'level', typeText: 'number', range: [4, 3] },
      { line: 2, symbol: 'owner', typeText: 'boolean', range: [true, false] },
    ]);
  });
});
