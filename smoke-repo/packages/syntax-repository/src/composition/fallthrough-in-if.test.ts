import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'fallthrough-in-if.ts'), 'utf8');

describe('composition / fallthrough-in-if — an if arm ending in a switch that falls through', () => {
  it('VALID: {fall-through switch inside an if arm} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('fallthrough-in-if.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  // REGRESSION GUARD for a real soundness bug: "does this always exit" and "are this statement's
  // ways out already emitted" are different questions, and answering both with one predicate makes
  // an if-arm ending in a fall-through switch look like it escapes. The trailing `return` would
  // then be guarded by that if's `else` — recording a genuinely unconditional exit as reachable
  // only one way, and keying it under a wrong coverage ID.
  it('VALID: {trailing return after a fall-through arm} => is UNGUARDED, because it runs on both arms', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/composition/fallthrough-in-if.ts' });
    const guards = result.success ? result.functions.flatMap((fn) => fn.exits).map((exit) => exit.guardPath) : [];

    expect(guards).toStrictEqual([[]]);
  });
});
