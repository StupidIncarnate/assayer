import * as bundled from './bundled-typescript';
// A raw `require`: `import x = require(...)` compiles straight to `require(...)`, so tsMorph is
// ts-morph's own runtime module, and tsMorph.ts is the compiler it bundles.
import tsMorph = require('ts-morph');

describe('bundled-typescript', () => {
  it('VALID: {module} => lifts sys off the compiler ts-morph bundles, the same object', () => {
    expect(bundled.sys).toBe(tsMorph.ts.sys);
  });

  it('VALID: {module} => lifts SyntaxKind off the compiler ts-morph bundles', () => {
    expect(bundled.SyntaxKind).toBe(tsMorph.ts.SyntaxKind);
  });

  it.each([
    ['findConfigFile', bundled.findConfigFile, tsMorph.ts.findConfigFile],
    ['parseConfigFileTextToJson', bundled.parseConfigFileTextToJson, tsMorph.ts.parseConfigFileTextToJson],
    ['parseJsonConfigFileContent', bundled.parseJsonConfigFileContent, tsMorph.ts.parseJsonConfigFileContent],
    ['readJsonConfigFile', bundled.readJsonConfigFile, tsMorph.ts.readJsonConfigFile],
    ['resolveModuleName', bundled.resolveModuleName, tsMorph.ts.resolveModuleName],
    ['transpileModule', bundled.transpileModule, tsMorph.ts.transpileModule],
  ])('VALID: {module} => lifts %s off the compiler ts-morph bundles', (_name, ours, real) => {
    expect(ours).toBe(real);
  });
});
