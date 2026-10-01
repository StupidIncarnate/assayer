import { resolveModuleFile } from './resolve-module-file';
import { resolveModuleFileProxy } from './resolve-module-file.proxy';

describe('resolveModuleFile', () => {
  it('VALID: {specifier TypeScript finds} => returns the resolved absolute file name', () => {
    const proxy = resolveModuleFileProxy();
    proxy.resolves({ specifier: '../b/foo', containingFile: '/repo/src/a/x.ts', resolvedFileName: '/repo/src/b/foo.ts' });

    const result = resolveModuleFile({ specifier: '../b/foo', containingFile: '/repo/src/a/x.ts', options: {} });

    expect(result).toBe('/repo/src/b/foo.ts');
  });

  it('EMPTY: {specifier that points at nothing} => returns undefined', () => {
    const proxy = resolveModuleFileProxy();
    proxy.resolvesNothing({ specifier: './missing', containingFile: '/repo/src/x.ts' });

    const result = resolveModuleFile({ specifier: './missing', containingFile: '/repo/src/x.ts', options: {} });

    expect(result).toBe(undefined);
  });

  it('VALID: {stage names the specifier only} => answers that specifier from any containing file', () => {
    const proxy = resolveModuleFileProxy();
    proxy.resolves({ specifier: 'left-pad', resolvedFileName: '/repo/node_modules/left-pad/index.d.ts' });

    const result = resolveModuleFile({ specifier: 'left-pad', containingFile: '/repo/src/deep/x.ts', options: {} });

    expect(result).toBe('/repo/node_modules/left-pad/index.d.ts');
  });

  it('VALID: {two one-shot stages for one specifier} => answers each call in the order staged', () => {
    const proxy = resolveModuleFileProxy();
    proxy.resolvesOnce({ specifier: '../barrel', resolvedFileName: '/repo/src/barrel/index.ts' });
    proxy.resolvesNothingOnce({ specifier: '../barrel' });

    const first = resolveModuleFile({ specifier: '../barrel', containingFile: '/repo/src/a/x.ts', options: {} });
    const second = resolveModuleFile({ specifier: '../barrel', containingFile: '/repo/src/a/x.ts', options: {} });

    expect([first, second]).toStrictEqual(['/repo/src/barrel/index.ts', undefined]);
  });

  it('ERROR: {no stage for the specifier} => the unstaged call throws instead of resolving', () => {
    resolveModuleFileProxy();

    expect(() =>
      resolveModuleFile({ specifier: './unstaged', containingFile: '/repo/src/x.ts', options: {} }),
    ).toThrow(/^registerMock: nothing set up for the call/u);
  });

  it('VALID: {a call already made} => getCallsFor reads back the specifier and containing file', () => {
    const proxy = resolveModuleFileProxy();
    proxy.resolves({ specifier: '../b/foo', resolvedFileName: '/repo/src/b/foo.ts' });

    resolveModuleFile({ specifier: '../b/foo', containingFile: '/repo/src/a/x.ts', options: { strict: true } });

    expect(proxy.getCallsFor({ specifier: '../b/foo' }).map((call) => call.slice(0, 3))).toStrictEqual([
      ['../b/foo', '/repo/src/a/x.ts', { strict: true }],
    ]);
  });
});
