import { ScriptTarget } from '../bundled-typescript/bundled-typescript';
import type { CompilerOptions } from '../bundled-typescript/bundled-typescript';

// With no overrides, this is TypeScript 5's default for a file no tsconfig owns, stated as options: an ES5 target,
// the libraries `lib.d.ts` pulls in (ES5, DOM, the web worker's `importScripts`, and Windows Script Host), and
// `strict` off, which TypeScript 6 turns on by default. A test that builds its own ts-morph project passes this, so
// the libraries and strictness its expectations depend on are named.
export const CompilerOptionsStub = ({ ...overrides }: CompilerOptions = {}): CompilerOptions => ({
  target: ScriptTarget.ES5,
  strict: false,
  lib: ['lib.es5.d.ts', 'lib.dom.d.ts', 'lib.webworker.importscripts.d.ts', 'lib.scripthost.d.ts'],
  ...overrides,
});
