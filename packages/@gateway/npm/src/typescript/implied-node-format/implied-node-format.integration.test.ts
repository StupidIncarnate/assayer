import { ModuleKind, ModuleResolutionKind } from '../bundled-typescript/bundled-typescript';
import { impliedNodeFormat } from './implied-node-format';

// Real reads over the real disk, against this folder's own file, with no proxy. The gateway package's
// own package.json carries no `type` field, so Node runs its `.ts` files as CommonJS.
describe('impliedNodeFormat against the real disk', () => {
  it('VALID: {nodenext options, package with no type field} => returns commonjs', () => {
    const result = impliedNodeFormat({
      fileName: `${__dirname}/implied-node-format.ts`,
      options: { module: ModuleKind.NodeNext, moduleResolution: ModuleResolutionKind.NodeNext },
    });

    expect(result).toBe('commonjs');
  });

  it('EMPTY: {esnext options with bundler resolution} => returns undefined, TypeScript makes no claim', () => {
    const result = impliedNodeFormat({
      fileName: `${__dirname}/implied-node-format.ts`,
      options: { module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler },
    });

    expect(result).toBe(undefined);
  });
});
