import * as pkgModule from 'vm';
import { createContext, runInContext } from './vm';

describe('#gateway/node/vm', () => {
  it('VALID: {createContext, runInContext} => each is the same binding vm provides', () => {
    expect([createContext, runInContext]).toStrictEqual([
      pkgModule.createContext,
      pkgModule.runInContext,
    ]);
  });

  it('VALID: {code writing module.exports, a CommonJS shell context} => the write lands on the host object', () => {
    const sandbox = { module: { exports: {} } };

    runInContext('module.exports.answer = 42;', createContext(sandbox), {
      filename: 'audit.harness.ts',
    });

    expect(sandbox.module.exports).toStrictEqual({ answer: 42 });
  });

  it('EMPTY: {an empty context} => the evaluated code sees no require, process or module', () => {
    const result: unknown = runInContext(
      "[typeof require, typeof process, typeof module].join(',')",
      createContext({}),
      { filename: 'audit.harness.ts' },
    );

    expect(result).toBe('undefined,undefined,undefined');
  });

  it('ERROR: {code that throws} => throws the error the evaluated code threw', () => {
    expect(() =>
      runInContext("throw new Error('boom');", createContext({}), {
        filename: 'audit.harness.ts',
      }),
    ).toThrow(/^boom$/u);
  });
});
