/**
 * PURPOSE: Reports whether an identifier is an AMBIENT-EXTERNAL candidate — a free name the hermetic
 *   walk cannot type, that a later stitch resolves against `@types/node`'s global scope (`process`,
 *   `console`, `Buffer`, …). It answers the same file-scoped question `read-env-operand` proves
 *   `process` with, generalized: a candidate is an identifier this file does NOT declare and the
 *   ECMAScript standard library does NOT declare either.
 *
 *   The two exclusions are the whole rule, and each is a type-graph fact read off the checker, never a
 *   naming convention. Declared in THIS file ⇒ the file's own binding, not the global (a
 *   `const process = …` opts out, exactly as in `read-env-operand`). Declared in a `lib.es*.d.ts` ⇒ an
 *   ECMAScript intrinsic (`Number`, `JSON`, `Math`) — already fully typed by the hermetic project, so
 *   not an EXTERNAL the reader must pull node types for. Everything else — a host global with zero
 *   declarations (`process`, `Buffer`) or one declared only in `lib.dom.d.ts` (`console`, `setTimeout`)
 *   — is a candidate the walk records WITHOUT resolving, keeping the hermetic project untouched (§5.10).
 *
 * USAGE:
 * readAmbientRootLayerAdapter({ node: identifier });
 * // Returns true for `process`/`console`, false for `Number`/a local binding/a non-identifier
 */
import { Node } from 'ts-morph';

const ECMASCRIPT_LIB_MARKER = '/lib.es';

export const readAmbientRootLayerAdapter = ({ node }: { node: Node }): boolean => {
  if (!Node.isIdentifier(node)) {
    return false;
  }

  const declarations = node.getSymbol()?.getDeclarations() ?? [];

  // Declared in THIS file — the file's own binding, not the ambient global.
  if (declarations.some((declaration) => declaration.getSourceFile() === node.getSourceFile())) {
    return false;
  }

  // Declared in the ECMAScript standard library — an intrinsic already typed here, not an external.
  if (declarations.some((declaration) => declaration.getSourceFile().getFilePath().includes(ECMASCRIPT_LIB_MARKER))) {
    return false;
  }

  return true;
};
