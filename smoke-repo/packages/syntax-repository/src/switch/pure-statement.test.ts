import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { tsMorphExtractAnalysisAdapter } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'pure-statement.ts'), 'utf8');

describe('switch / pure-statement — bare top-level switch', () => {
  it('VALID: {bare top-level switch} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('pure-statement.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('EDGE: {bare top-level switch} => analyzer yields no entries (module-scope pass NOT YET BUILT)', () => {
    const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/switch/pure-statement.ts' });
    expect(result).toStrictEqual({ success: true, functions: [] });
  });
});
