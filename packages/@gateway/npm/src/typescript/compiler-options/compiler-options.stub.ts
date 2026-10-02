import { ScriptTarget } from '../bundled-typescript/bundled-typescript';
import type { CompilerOptions } from '../bundled-typescript/bundled-typescript';

// With no overrides, a small library set stated as options, so a test that builds its own ts-morph project names the
// libraries and strictness its expectations depend on instead of inheriting the bundled TypeScript's defaults. The
// set is the one TypeScript 5 loaded for a file no tsconfig owns: the libraries `lib.d.ts` pulls in (ES5, DOM, the web
// worker's `importScripts`, and Windows Script Host), with `strict` off. The target is ES2015 because TypeScript 6
// deprecates ES5, and its DOM library pulls in ES2015 either way.
export const CompilerOptionsStub = ({ ...overrides }: CompilerOptions = {}): CompilerOptions => ({
  target: ScriptTarget.ES2015,
  strict: false,
  lib: ['lib.es5.d.ts', 'lib.dom.d.ts', 'lib.webworker.importscripts.d.ts', 'lib.scripthost.d.ts'],
  ...overrides,
});
