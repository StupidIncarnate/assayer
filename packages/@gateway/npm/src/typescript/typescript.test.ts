import * as ourModule from './typescript';
import ourDefault from './typescript';
// A raw `require`, not `import * as`: `import x = require(...)` compiles straight to `require(...)`,
// so tsMorph is ts-morph's own real runtime module, and tsMorph.ts is the compiler it bundles.
import tsMorph = require('ts-morph');

describe('#gateway/npm/typescript', () => {
  it("VALID: {module} => default export is the compiler ts-morph bundles, the same object", () => {
    expect(ourDefault).toBe(tsMorph.ts);
  });

  it('VALID: {module} => re-exports SyntaxKind as the bundled compiler value', () => {
    expect(ourModule.SyntaxKind).toBe(tsMorph.ts.SyntaxKind);
  });

  it.each([
    ['findConfigFile', ourModule.findConfigFile, tsMorph.ts.findConfigFile],
    ['isExpression', ourModule.isExpression, tsMorph.ts.isExpression],
    ['isStatement', ourModule.isStatement, tsMorph.ts.isStatement],
    ['parseJsonConfigFileContent', ourModule.parseJsonConfigFileContent, tsMorph.ts.parseJsonConfigFileContent],
    ['readConfigFile', ourModule.readConfigFile, tsMorph.ts.readConfigFile],
    ['resolveModuleName', ourModule.resolveModuleName, tsMorph.ts.resolveModuleName],
    ['resolveProjectReferencePath', ourModule.resolveProjectReferencePath, tsMorph.ts.resolveProjectReferencePath],
    ['transform', ourModule.transform, tsMorph.ts.transform],
    ['transpileModule', ourModule.transpileModule, tsMorph.ts.transpileModule],
    ['visitEachChild', ourModule.visitEachChild, tsMorph.ts.visitEachChild],
  ])('VALID: {module} => re-exports %s as the bundled compiler function', (_name, ours, real) => {
    expect(ours).toBe(real);
  });
});
