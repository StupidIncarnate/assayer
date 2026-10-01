import { ScriptTarget } from '../bundled-typescript/bundled-typescript';
import type { CompilerOptions } from '../bundled-typescript/bundled-typescript';

// With no overrides, this is TypeScript's own default for a file no tsconfig owns, stated as options: an ES5 target
// and the libraries `lib.d.ts` pulls in (ES5, DOM, the web worker's `importScripts`, and Windows Script Host). A test
// that builds its own ts-morph project passes this, so the libraries its expectations depend on are named.
export const CompilerOptionsStub = ({ ...overrides }: CompilerOptions = {}): CompilerOptions => ({
  target: ScriptTarget.ES5,
  lib: ['lib.es5.d.ts', 'lib.dom.d.ts', 'lib.webworker.importscripts.d.ts', 'lib.scripthost.d.ts'],
  ...overrides,
});
