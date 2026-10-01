import { ModuleKind, ModuleResolutionKind } from '#gateway/npm/typescript';

import { moduleFormatReadBroker } from './module-format-read-broker';
import { moduleFormatReadBrokerProxy } from './module-format-read-broker.proxy';

describe('moduleFormatReadBroker', () => {
  describe('TypeScript gives an answer', () => {
    it('VALID: {nodenext tsconfig, TypeScript says esm} => esm, with no second question', () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileIs({
        absPath: '/repo/src/grade.ts',
        options: { module: ModuleKind.NodeNext, moduleResolution: ModuleResolutionKind.NodeNext },
        declared: 'esm',
        nodeRule: 'commonjs',
      });

      const result = moduleFormatReadBroker({ absPath: '/repo/src/grade.ts' });

      expect(result).toBe('esm');
      expect(proxy.getFormatCallsFor({ absPath: '/repo/src/grade.ts' }).map((call) => call[3])).toStrictEqual([
        { module: 199, moduleResolution: 99 },
      ]);
    });

    it('VALID: {nodenext tsconfig, TypeScript says commonjs} => commonjs', () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileIs({
        absPath: '/repo/src/grade.ts',
        options: { module: ModuleKind.NodeNext, moduleResolution: ModuleResolutionKind.NodeNext },
        declared: 'commonjs',
        nodeRule: 'esm',
      });

      const result = moduleFormatReadBroker({ absPath: '/repo/src/grade.ts' });

      expect(result).toBe('commonjs');
    });
  });

  describe('TypeScript makes no claim', () => {
    it("VALID: {esnext tsconfig, Node's rule says esm} => esm, asked again under nodenext", () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileIs({
        absPath: '/repo/src/grade.ts',
        options: { module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler },
        declared: undefined,
        nodeRule: 'esm',
      });

      const result = moduleFormatReadBroker({ absPath: '/repo/src/grade.ts' });

      expect(result).toBe('esm');
      expect(proxy.getFormatCallsFor({ absPath: '/repo/src/grade.ts' }).map((call) => call[3])).toStrictEqual([
        { module: 99, moduleResolution: 100 },
        { module: 199, moduleResolution: 99 },
      ]);
    });

    it("VALID: {esnext tsconfig, Node's rule says commonjs} => commonjs", () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileIs({
        absPath: '/repo/src/grade.ts',
        options: { module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler },
        declared: undefined,
        nodeRule: 'commonjs',
      });

      const result = moduleFormatReadBroker({ absPath: '/repo/src/grade.ts' });

      expect(result).toBe('commonjs');
    });

    it("EDGE: {Node's rule leaves the file undecided} => commonjs, Node's default", () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileIs({
        absPath: '/repo/src/data.json',
        options: { module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler },
        declared: undefined,
        nodeRule: undefined,
      });

      const result = moduleFormatReadBroker({ absPath: '/repo/src/data.json' });

      expect(result).toBe('commonjs');
    });
  });

  describe('no owning tsconfig', () => {
    it('EMPTY: {no tsconfig owns the file} => asks with empty options and takes the answer', () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileWithoutTsconfigIs({ absPath: '/repo/grade.ts', format: 'esm' });

      const result = moduleFormatReadBroker({ absPath: '/repo/grade.ts' });

      expect(result).toBe('esm');
      expect(proxy.getFormatCallsFor({ absPath: '/repo/grade.ts' }).map((call) => call[3])).toStrictEqual([{}]);
    });
  });
});
