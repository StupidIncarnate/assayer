import { moduleFormatReadBroker } from './module-format-read-broker';
import { moduleFormatReadBrokerProxy } from './module-format-read-broker.proxy';

const NODENEXT = '{ "compilerOptions": { "module": "nodenext", "moduleResolution": "nodenext" } }';
const ESNEXT = '{ "compilerOptions": { "module": "esnext", "moduleResolution": "bundler" } }';

describe('moduleFormatReadBroker', () => {
  describe('TypeScript gives an answer', () => {
    it('VALID: {nodenext tsconfig, TypeScript says esm} => esm, with no second question', () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileIs({
        absPath: '/repo/src/grade.ts',
        directory: '/repo/src',
        tsconfigText: NODENEXT,
        declared: 'esm',
        nodeRule: 'commonjs',
      });

      const result = moduleFormatReadBroker({ absPath: '/repo/src/grade.ts' });

      expect(result).toBe('esm');
      expect(proxy.getFormatCallsFor({ absPath: '/repo/src/grade.ts' }).map((call) => call[3])).toStrictEqual([
        { module: 199, moduleResolution: 99, configFilePath: undefined },
      ]);
    });

    it('VALID: {nodenext tsconfig, TypeScript says commonjs} => commonjs', () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileIs({
        absPath: '/repo/src/grade.ts',
        directory: '/repo/src',
        tsconfigText: NODENEXT,
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
        directory: '/repo/src',
        tsconfigText: ESNEXT,
        declared: undefined,
        nodeRule: 'esm',
      });

      const result = moduleFormatReadBroker({ absPath: '/repo/src/grade.ts' });

      expect(result).toBe('esm');
      expect(proxy.getFormatCallsFor({ absPath: '/repo/src/grade.ts' }).map((call) => call[3])).toStrictEqual([
        { module: 99, moduleResolution: 100, configFilePath: undefined },
        { module: 199, moduleResolution: 99, configFilePath: undefined },
      ]);
    });

    it("VALID: {esnext tsconfig, Node's rule says commonjs} => commonjs", () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileIs({
        absPath: '/repo/src/grade.ts',
        directory: '/repo/src',
        tsconfigText: ESNEXT,
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
        directory: '/repo/src',
        tsconfigText: ESNEXT,
        declared: undefined,
        nodeRule: undefined,
      });

      const result = moduleFormatReadBroker({ absPath: '/repo/src/data.json' });

      expect(result).toBe('commonjs');
    });
  });

  describe('no tsconfig', () => {
    it('EMPTY: {no tsconfig above the file} => asks with empty options and takes the answer', () => {
      const proxy = moduleFormatReadBrokerProxy();
      proxy.fileWithoutTsconfigIs({ absPath: '/repo/grade.ts', directory: '/repo', format: 'esm' });

      const result = moduleFormatReadBroker({ absPath: '/repo/grade.ts' });

      expect(result).toBe('esm');
      expect(proxy.getFormatCallsFor({ absPath: '/repo/grade.ts' }).map((call) => call[3])).toStrictEqual([{}]);
    });
  });
});
