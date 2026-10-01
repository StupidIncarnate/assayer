/**
 * PURPOSE: Answers whether a type is an OPAQUE library type: a NAMED type that only TypeScript's default library
 *   declares, such as `Map`, `Date` or `HTMLElement`, and that has at least one callable member. A type reader
 *   keeps such a type opaque: it records the reference and its type arguments, never the structural expansion of
 *   every method the library declares. Which library files load depends on the owning tsconfig's `lib` and
 *   `target`, so expanding a library type with methods would make a parameter's descriptor depend on the library
 *   set instead of on the code. Assayer cannot build a value that bottoms out in a function either, so the
 *   expansion would buy nothing. The answer comes from the program itself (`isSourceFileDefaultLibrary` on each
 *   declaration's file, and the call signatures of each member's type), never from a type name or a file path.
 *
 *   A library type made only of data properties, such as `Error` (`name`, `message`, `stack?`), is not opaque
 *   here. A reader expands it like any other object, so a parameter of that type stays fillable.
 *
 *   An anonymous type (`__type`, the symbol of a type literal or of a mapped type such as `Partial<Config>`) is
 *   never a library type here, even when the library declares the mapped type: its members come from the type
 *   it maps over, so a reader enumerates it as before. A type the file augments (`interface Date { x: 1 }` in the
 *   source) has a declaration outside the library, so it is not a library type either.
 *
 * USAGE:
 * isDefaultLibraryTypeGuard({ type: param.getType() });
 * // Returns true for `counts: Map<string, number>`, false for `failure: Error` and for a same-file `config: Config`
 */
import type { Type } from '#gateway/npm/ts-morph';

export const isDefaultLibraryTypeGuard = ({ type }: { type?: Type }): boolean => {
  const symbol = type?.getSymbol();

  if (type === undefined || symbol === undefined || symbol.getName() === '__type') {
    return false;
  }

  const declarations = symbol.getDeclarations();
  const [location] = declarations;

  if (
    location === undefined ||
    !declarations.every((declaration) => {
      const sourceFile = declaration.getSourceFile();

      return sourceFile.getProject().getProgram().compilerObject.isSourceFileDefaultLibrary(sourceFile.compilerNode);
    })
  ) {
    return false;
  }

  // A member is callable when its type carries a call signature: a method, or a property typed as a function.
  // An optional method's type is `(() => void) | undefined`, so `undefined` is stripped before asking.
  return type.getProperties().some((property) => {
    const declaration = property.getDeclarations()[0] ?? location;

    return property.getTypeAtLocation(declaration).getNonNullableType().getCallSignatures().length > 0;
  });
};
