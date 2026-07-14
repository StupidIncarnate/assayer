import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { tsMorphExtractAnalysisAdapter } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'in-class.ts'), 'utf8');

describe('switch / in-class — switch inside an exported class method', () => {
  it('VALID: {exported class method with switch} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('in-class.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('EDGE: {exported class method with switch} => analyzer yields no entries (class-method pass NOT YET BUILT)', () => {
    const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/switch/in-class.ts' });
    expect(result).toStrictEqual({ success: true, functions: [] });
  });
});
