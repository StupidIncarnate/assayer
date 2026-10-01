/**
 * PURPOSE: Answers whether a type is a NAMED type that only TypeScript's default library declares, such as `Map`,
 *   `Date` or `HTMLElement`. A type reader keeps such a type opaque: it records the reference and its type
 *   arguments, never the structural expansion of every method the library declares. Which library files load
 *   depends on the owning tsconfig's `lib` and `target`, so expanding a library type would make a parameter's
 *   descriptor depend on the library set instead of on the code. The answer comes from the program itself
 *   (`isSourceFileDefaultLibrary` on each declaration's file), never from a type name or a file path.
 *
 *   An anonymous type (`__type`, the symbol of a type literal or of a mapped type such as `Partial<Config>`) is
 *   never a library type here, even when the library declares the mapped type: its members come from the type
 *   it maps over, so a reader enumerates it as before. A type the file augments (`interface Date { x: 1 }` in the
 *   source) has a declaration outside the library, so it is not a library type either.
 *
 * USAGE:
 * isDefaultLibraryTypeGuard({ type: param.getType() });
 * // Returns true for `counts: Map<string, number>`, false for `config: Config` declared in the same file
 */
import type { Type } from '#gateway/npm/ts-morph';

export const isDefaultLibraryTypeGuard = ({ type }: { type?: Type }): boolean => {
  const symbol = type?.getSymbol();

  if (symbol === undefined || symbol.getName() === '__type') {
    return false;
  }

  const declarations = symbol.getDeclarations();

  return (
    declarations.length > 0 &&
    declarations.every((declaration) => {
      const sourceFile = declaration.getSourceFile();

      return sourceFile.getProject().getProgram().compilerObject.isSourceFileDefaultLibrary(sourceFile.compilerNode);
    })
  );
};
