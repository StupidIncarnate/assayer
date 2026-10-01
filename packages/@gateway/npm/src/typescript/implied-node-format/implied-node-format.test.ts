import { ModuleKind, sys } from '../bundled-typescript/bundled-typescript';
import { impliedNodeFormat } from './implied-node-format';
import { impliedNodeFormatProxy } from './implied-node-format.proxy';

describe('impliedNodeFormat', () => {
  it('VALID: {TypeScript says ESNext} => returns esm', () => {
    const proxy = impliedNodeFormatProxy();
    proxy.formatIs({ fileName: '/repo/src/a.ts', format: 'esm' });

    const result = impliedNodeFormat({ fileName: '/repo/src/a.ts', options: { module: ModuleKind.NodeNext } });

    expect(result).toBe('esm');
  });

  it('VALID: {TypeScript says CommonJS} => returns commonjs', () => {
    const proxy = impliedNodeFormatProxy();
    proxy.formatIs({ fileName: '/repo/src/a.ts', format: 'commonjs' });

    const result = impliedNodeFormat({ fileName: '/repo/src/a.ts', options: { module: ModuleKind.Node16 } });

    expect(result).toBe('commonjs');
  });

  it('EMPTY: {TypeScript makes no claim} => returns undefined', () => {
    const proxy = impliedNodeFormatProxy();
    proxy.formatIs({ fileName: '/repo/src/a.ts', format: undefined });

    const result = impliedNodeFormat({ fileName: '/repo/src/a.ts', options: { module: ModuleKind.ESNext } });

    expect(result).toBe(undefined);
  });

  it('VALID: {a call already made} => passes the file, no cache, ts.sys and the options through', () => {
    const proxy = impliedNodeFormatProxy();
    proxy.formatIs({ fileName: '/repo/src/a.ts', format: 'esm' });

    impliedNodeFormat({ fileName: '/repo/src/a.ts', options: { module: ModuleKind.NodeNext } });

    expect(proxy.getCallsFor({ fileName: '/repo/src/a.ts' })).toStrictEqual([
      ['/repo/src/a.ts', undefined, sys, { module: ModuleKind.NodeNext }],
    ]);
  });

  it('ERROR: {no stage for the file} => the unstaged call throws instead of answering', () => {
    impliedNodeFormatProxy();

    expect(() => impliedNodeFormat({ fileName: '/repo/unstaged.ts', options: {} })).toThrow(
      /^registerMock: nothing set up for the call/u,
    );
  });
});
