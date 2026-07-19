import { CompiledFileBlobStub, ModuleEdgeStub } from '@assayer/shared/contracts';

import { resolveSpecifierLayerBroker } from './resolve-specifier-layer-broker';
import { resolveSpecifierLayerBrokerProxy } from './resolve-specifier-layer-broker.proxy';

// A map whose only key never matches any resolved path — i.e. "no usable blobs" — typed by inference.
const NO_BLOBS = new Map([['__none__', CompiledFileBlobStub()]]);
// A builtins set that contains no real builtin, so classification never short-circuits to builtin.
const NO_BUILTINS = new Set(['__no_such_builtin__']);

describe('resolveSpecifierLayerBroker', () => {
  describe('node builtin specifiers', () => {
    it('VALID: {specifier "node:fs"} => builtin classification keyed by the bare name', () => {
      resolveSpecifierLayerBrokerProxy();

      const result = resolveSpecifierLayerBroker({
        containingFile: '/repo/src/a.ts',
        specifier: 'node:fs',
        root: '/repo',
        options: {},
        blobsByRelPath: NO_BLOBS,
        builtins: NO_BUILTINS,
        seen: new Set(),
      });

      expect(result).toStrictEqual({ kind: 'builtin', packageName: 'fs' });
    });

    it('VALID: {bare "fs" in the builtins set} => builtin classification', () => {
      resolveSpecifierLayerBrokerProxy();

      const result = resolveSpecifierLayerBroker({
        containingFile: '/repo/src/a.ts',
        specifier: 'fs',
        root: '/repo',
        options: {},
        blobsByRelPath: NO_BLOBS,
        builtins: new Set(['fs']),
        seen: new Set(),
      });

      expect(result).toStrictEqual({ kind: 'builtin', packageName: 'fs' });
    });
  });

  describe('a specifier that resolves to nothing', () => {
    it('EMPTY: {specifier "./missing" resolves false} => unresolved', () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.resolvesUnresolved();

      const result = resolveSpecifierLayerBroker({
        containingFile: '/repo/src/a.ts',
        specifier: './missing',
        root: '/repo',
        options: {},
        blobsByRelPath: NO_BLOBS,
        builtins: NO_BUILTINS,
        seen: new Set(),
      });

      expect(result).toStrictEqual({ kind: 'unresolved' });
    });
  });

  describe('a specifier that resolves inside the repo', () => {
    it('VALID: {resolves to /repo/src/b/foo.ts, no importedName} => local keyed by repo-relative path', () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.resolvesLocal({ fileName: '/repo/src/b/foo.ts' });

      const result = resolveSpecifierLayerBroker({
        containingFile: '/repo/src/a/caller.ts',
        specifier: '../b/foo',
        root: '/repo',
        options: {},
        blobsByRelPath: NO_BLOBS,
        builtins: NO_BUILTINS,
        seen: new Set(),
      });

      expect(result).toStrictEqual({ kind: 'local', relPath: 'src/b/foo.ts' });
    });
  });

  describe('a specifier that resolves into node_modules', () => {
    it('VALID: {resolves under node_modules} => package keyed by the specifier package name', () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.resolvesLocal({ fileName: '/repo/node_modules/vendored-pkg/index.d.ts' });

      const result = resolveSpecifierLayerBroker({
        containingFile: '/repo/src/a/caller.ts',
        specifier: 'vendored-pkg',
        root: '/repo',
        options: {},
        blobsByRelPath: NO_BLOBS,
        builtins: NO_BUILTINS,
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'package',
        packageName: 'vendored-pkg',
        dtsPath: '/repo/node_modules/vendored-pkg/index.d.ts',
      });
    });

    it('VALID: {a scoped package resolves under node_modules} => package keyed by the scoped name', () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.resolvesLocal({ fileName: '/repo/node_modules/@scope/pkg/index.d.ts' });

      const result = resolveSpecifierLayerBroker({
        containingFile: '/repo/src/a/caller.ts',
        specifier: '@scope/pkg/sub',
        root: '/repo',
        options: {},
        blobsByRelPath: NO_BLOBS,
        builtins: NO_BUILTINS,
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'package',
        packageName: '@scope/pkg',
        dtsPath: '/repo/node_modules/@scope/pkg/index.d.ts',
      });
    });
  });

  describe('a re-export barrel followed to the definition', () => {
    it('VALID: {barrel re-exports foo from ../b/foo} => local keyed by the definition, not the barrel', () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.resolvesLocalOnce({ fileName: '/repo/src/barrel/index.ts' });
      proxy.resolvesLocalOnce({ fileName: '/repo/src/b/foo.ts' });
      const barrel = CompiledFileBlobStub({
        relPath: 'src/barrel/index.ts',
        moduleGraph: {
          edges: [
            ModuleEdgeStub({ kind: 'reexport', specifier: '../b/foo', bindings: [{ kind: 'named', name: 'foo' }] }),
          ],
          references: [],
        },
      });

      const result = resolveSpecifierLayerBroker({
        containingFile: '/repo/src/a/caller.ts',
        specifier: '../barrel',
        importedName: 'foo',
        root: '/repo',
        options: {},
        blobsByRelPath: new Map([['src/barrel/index.ts', barrel]]),
        builtins: NO_BUILTINS,
        seen: new Set(),
      });

      expect(result).toStrictEqual({ kind: 'local', relPath: 'src/b/foo.ts' });
    });
  });

  describe('a re-export barrel that cycles back to itself', () => {
    it('EDGE: {loop.ts re-exports foo from ./loop} => the seen-set stops the recursion at the barrel', () => {
      const proxy = resolveSpecifierLayerBrokerProxy();
      proxy.resolvesLocal({ fileName: '/repo/src/loop.ts' });
      const loop = CompiledFileBlobStub({
        relPath: 'src/loop.ts',
        moduleGraph: {
          edges: [
            ModuleEdgeStub({ kind: 'reexport', specifier: './loop', bindings: [{ kind: 'named', name: 'foo' }] }),
          ],
          references: [],
        },
      });

      const result = resolveSpecifierLayerBroker({
        containingFile: '/repo/src/a.ts',
        specifier: '../loop',
        importedName: 'foo',
        root: '/repo',
        options: {},
        blobsByRelPath: new Map([['src/loop.ts', loop]]),
        builtins: NO_BUILTINS,
        seen: new Set(),
      });

      expect(result).toStrictEqual({ kind: 'local', relPath: 'src/loop.ts' });
    });
  });
});
