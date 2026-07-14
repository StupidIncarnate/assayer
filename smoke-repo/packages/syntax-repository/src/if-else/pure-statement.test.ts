import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { tsMorphExtractAnalysisAdapter } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'pure-statement.ts'), 'utf8');

describe('if-else / pure-statement — bare top-level if/else', () => {
  it('VALID: {bare top-level if/else} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('pure-statement.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('EDGE: {bare top-level if/else} => analyzer yields no entries (module-scope pass NOT YET BUILT)', () => {
    const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/if-else/pure-statement.ts' });
    expect(result).toStrictEqual({ success: true, functions: [] });
  });
});
