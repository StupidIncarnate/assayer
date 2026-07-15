import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'not.ts'), 'utf8');
const relPath = 'src/boolean/not.ts';

const BRANCH = '*module*/gate/if:PrefixUnaryExpression,id:ready';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

describe('boolean / not — a negated operand inside an exported function', () => {
  it('VALID: {! condition} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('not.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  // Negation is STRUCTURE, not a predicate: the leaf keeps its plain `truthy` predicate and the
  // `not` wraps it. That is why no predicate needs a negated twin and the type→range engine is
  // untouched by `!`.
  it('VALID: {!ready} => a not wrapping a truthy leaf, rather than a negated predicate', () => {
    const result = analyzeExtractBroker({ source, relPath });
    const conditions = result.success ? result.functions.flatMap((fn) => fn.branches).map((b) => b.condition) : [];

    expect(conditions).toStrictEqual([
      {
        kind: 'not',
        operand: {
          kind: 'leaf',
          id: `${BRANCH}#leaf.0`,
          operandParamName: 'ready',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        },
      },
    ]);
  });

  // The arms INVERT. Before the tree, `!ready` was an unrecognized predicate and both arms derived
  // `ready: false` — so the else-case claimed `gate(false)` reaches the else, which is the opposite
  // of what the code does.
  it('VALID: {!ready} => then arranges ready=false and else arranges ready=true', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesExit: THEN, arrange: [{ param: 'ready', value: false }] },
      { reachesExit: ELSE, arrange: [{ param: 'ready', value: true }] },
    ]);
  });
});
