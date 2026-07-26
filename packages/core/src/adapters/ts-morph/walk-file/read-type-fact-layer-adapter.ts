/**
 * PURPOSE: Reads a TypeScript type into a serializable TypeFact — the raw type-checker readout
 *   (primitive flavor, a resolved literal value, a union of member facts, an ARRAY of its element
 *   type, an OBJECT enumerating its named properties, or a CALLABLE carrying the checker's canonical
 *   rendering of the type) with NO interpretation, which `typeDescriptorTransformer` alone owns.
 *   RECURSES through union members, array elements and object properties, so nested and enumerated
 *   shapes are read by this one function rather than a second copy of the classifier. Per §5.10 only
 *   types the hermetic walk resolves are enumerated — a same-file declaration — because an imported
 *   type is `any` here and stays opaque.
 *
 *   `widen` first collapses a literal binding (`const n = 7`) to its base type, which module-scope
 *   operands need. `boolean` is a primitive here (never fanned out into its `true | false` union),
 *   while a boolean LITERAL is a literal fact: the checker splits `string | boolean` into three
 *   members (`string`, `false`, `true`), and a member with no flavor of its own would degrade the whole
 *   union to `unknown`. A type carrying CALL SIGNATURES is a callable, read before the object branch so
 *   a callback keeps its own identity instead of reading as a property-less object and a method keeps
 *   its own instead of naming a type after itself; its `text` is whatever the CHECKER renders the type
 *   as, which is the type's NAME when it has one (`Hybrid` for a named interface carrying a call
 *   signature) and the rendered signature when it is anonymous. An object's `typeName` is its symbol
 *   NAME, or its ALIAS symbol's name when the object symbol is the anonymous `__type` a
 *   `type X = { … }` produces (§5.1-sanctioned, not span text); a shape with neither stays keyless.
 *   `seen` threads
 *   the type names on the current path DOWN the recursion so a self-referential type truncates to a
 *   reference-only object rather than recursing forever, and that truncation is MARKED `truncated` —
 *   the reader is the only thing that knows the empty property list is its own stopping point rather
 *   than the type's declaration.
 *
 *   `typeNode` is the DECLARATION the type was read from, threaded down beside the type for the two
 *   things the checker cannot answer about an opaque type. First, `any` absorbs a union, so `Db |
 *   string` with `Db` imported comes back as `any` (§5.10), and `read-declared-type-text` renders it per
 *   member instead. Second, a plain type REFERENCE gives up its NAME, which is the foreign key a
 *   consume-time overlay resolves the real declaration by. Both reach only the opaque `other` arm, and
 *   the node travels into an array's ELEMENT and an object's PROPERTIES, which collapse the same way —
 *   so `Config[]` names `Config` on its element. A union fact needs none: an `any` member would have
 *   absorbed the union before it could be read as one.
 *
 * USAGE:
 * readTypeFactLayerAdapter({ type: param.getType(), typeNode: param.getTypeNode() });
 * // Returns { flavor: 'union', members: [{ flavor: 'literal', value: 'get' }, …], text: '"get" | "post"' }
 */
import { Node } from 'ts-morph';
import type { Type, TypeNode } from 'ts-morph';

import { representativeValueContract, symbolNameContract, typeTextContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

import type { TypeFact } from '../../../contracts/type-fact/type-fact-contract';
import { readDeclaredTypeTextLayerAdapter } from './read-declared-type-text-layer-adapter';

export const readTypeFactLayerAdapter = ({
  type,
  typeNode,
  widen,
  seen,
}: {
  type: Type;
  typeNode?: TypeNode | undefined;
  widen?: boolean;
  seen?: ReadonlySet<SymbolName>;
}): TypeFact => {
  const readType = widen === true ? type.getBaseTypeOfLiteralType() : type;
  const onPath = seen ?? new Set<SymbolName>();

  if (readType.isString()) {
    return { flavor: 'string' };
  }
  if (readType.isNumber()) {
    return { flavor: 'number' };
  }
  if (readType.isBoolean()) {
    return { flavor: 'boolean' };
  }
  // An enum-member type carries `EnumLiteral` alongside `StringLiteral`/`NumberLiteral` — the checker
  // never sets it alone — so a string- or number-literal enum member is already caught above; a
  // computed member (no literal value at all) fails both and falls through to the opaque `other` arm.
  if (readType.isStringLiteral() || readType.isNumberLiteral()) {
    return { flavor: 'literal', value: representativeValueContract.parse(readType.getLiteralValueOrThrow()) };
  }
  // A boolean literal carries no `getLiteralValue()` — the checker models `true` and `false` as two
  // intrinsic types, and only their canonical rendering says which one this is. That rendering is the
  // checker's, never the source's, so it is the same two strings whatever the operand was spelled as.
  if (readType.isBooleanLiteral()) {
    return { flavor: 'literal', value: representativeValueContract.parse(readType.getText() === 'true') };
  }
  if (readType.isUnion()) {
    return {
      flavor: 'union',
      members: readType.getUnionTypes().map((member) => readTypeFactLayerAdapter({ type: member, seen: onPath })),
      text: typeTextContract.parse(readType.getText()),
    };
  }
  // Arrays are objects too, so this MUST precede the object branch — otherwise an array would be
  // enumerated as an object with only its `length`/method members.
  if (readType.isArray()) {
    // The ELEMENT's own declaration travels with it, so an element the checker collapses (`(Db |
    // string)[]`) is still rendered as the signature declares it rather than as `any`.
    const elementNode = typeNode !== undefined && Node.isArrayTypeNode(typeNode) ? typeNode.getElementTypeNode() : undefined;

    return {
      flavor: 'array',
      element: readTypeFactLayerAdapter({
        type: readType.getArrayElementTypeOrThrow(),
        ...(elementNode === undefined ? {} : { typeNode: elementNode }),
        seen: onPath,
      }),
    };
  }
  // A function type is an object to the checker too, so this MUST precede the object branch — the
  // same ordering reason the array check does. Enumerated as an object a callback comes back with an
  // empty property list, indistinguishable from an empty interface.
  if (readType.getCallSignatures().length > 0) {
    return { flavor: 'callable', text: typeTextContract.parse(readType.getText()) };
  }
  if (readType.isObject()) {
    // Two ways a shape carries a name, and the checker answers them on different symbols. An
    // `interface Config` names its own symbol; a `type Config = { … }` names an ANONYMOUS object
    // symbol (`__type`) and hangs `Config` on the ALIAS symbol, so reading only the first spells every
    // alias keyless and drops the shape out of every name-keyed artifact downstream. Both are the
    // resolved symbol's name, never source text (§5.1), so the two spellings behave identically.
    const rawName = readType.getSymbol()?.getName();
    const aliasName = readType.getAliasSymbol()?.getName();
    const declaredName = rawName === undefined || rawName === '__type' ? aliasName : rawName;
    const typeName = declaredName === undefined ? undefined : symbolNameContract.parse(declaredName);

    // A type already on the current path re-entered — truncate to a reference-only object so a
    // recursive shape (`interface Tree { next: Tree }`) terminates instead of recursing forever. The
    // truncation is MARKED, because only the reader knows the empty property list is where it stopped:
    // downstream, `{}` satisfies `interface Empty {}` and does not satisfy `Tree`.
    if (typeName !== undefined && onPath.has(typeName)) {
      return { flavor: 'object', typeName, truncated: true, properties: [] };
    }

    const nextSeen = typeName === undefined ? onPath : new Set([...onPath, typeName]);
    const location = readType.getSymbol()?.getDeclarations()[0];
    const properties = readType
      .getProperties()
      .map((symbol): { name: SymbolName; fact: TypeFact } => {
        const declaration = symbol.getDeclarations()[0] ?? location;
        // A TUPLE's numeric-index properties (`0`, `1`, `length` on `readonly [string, number]`) carry
        // no declaration of their own AND the tuple type itself carries no symbol to fall back to — the
        // checker synthesizes them structurally, with no node anywhere to read a type off. `unknown`
        // is the honest answer, not a fallback for something that "can't happen": `sad-path/run-gap/
        // tuple-param` reaches exactly this arm for a `readonly [string, number]` parameter.
        const propertyNode =
          declaration !== undefined && (Node.isPropertySignature(declaration) || Node.isPropertyDeclaration(declaration))
            ? declaration.getTypeNode()
            : undefined;

        // Whether the shape DECLARES the property with a question mark. Read off the declaration
        // because the checker widens `child?: TreeNode` to the same `TreeNode` a required property
        // declares, so the type cannot answer it — the same reason a parameter's optionality is read
        // off the parameter.
        const optional =
          declaration !== undefined &&
          (Node.isPropertySignature(declaration) || Node.isPropertyDeclaration(declaration)) &&
          declaration.hasQuestionToken();

        return {
          name: symbolNameContract.parse(symbol.getName()),
          fact:
            declaration === undefined
              ? { flavor: 'other', text: typeTextContract.parse('unknown') }
              : readTypeFactLayerAdapter({
                  type: symbol.getTypeAtLocation(declaration),
                  ...(propertyNode === undefined ? {} : { typeNode: propertyNode }),
                  seen: nextSeen,
                }),
          ...(optional ? { optional: true } : {}),
        };
      })
      // Sorted by property name so the enumeration is byte-identical run to run (getProperties order
      // is declaration order, which formatting could reshuffle).
      .sort((a, b) => (String(a.name) < String(b.name) ? -1 : String(a.name) > String(b.name) ? 1 : 0));

    return { flavor: 'object', ...(typeName === undefined ? {} : { typeName }), properties };
  }
  // The one place the checker's own rendering can be less than what the signature says: `any` ABSORBS a
  // union, so `Db | string` (with `Db` imported, hence `any` in the hermetic walk) renders as `any`.
  // When the DECLARATION is in hand, read the text off it instead — same checker, asked per member.
  //
  // A plain type REFERENCE also gives up its name here, and only here: the checker has nothing to say
  // about an imported type in the hermetic walk (§5.10), so the declared reference is the one handle on
  // what the signature meant. It is the reference identifier's name — the same §5.1-sanctioned read
  // `read-condition` makes for an object-member operand's root type — and it is a foreign key a
  // consume-time overlay resolves against the definition, never display.
  const reference = typeNode !== undefined && Node.isTypeReference(typeNode) ? typeNode : undefined;
  const typeRef = reference === undefined ? undefined : symbolNameContract.parse(reference.getTypeName().getText());
  // The reference's type ARGUMENTS, read through this same function so `Box<Config>` carries a nested
  // reference exactly as `config: Config` does. They are what a generic declaration's type PARAMETERS
  // stand for: `type Box<T> = { value: T }` denotes nothing constructible until a reference says what
  // `T` is, and without them the overlay resolves `Box` to a shape with an unresolvable property and
  // invoices a reader for an input the declaration describes in full.
  const typeArgs = reference
    ?.getTypeArguments()
    .map((argument) => readTypeFactLayerAdapter({ type: argument.getType(), typeNode: argument, seen: onPath }));

  return {
    flavor: 'other',
    text:
      typeNode === undefined
        ? typeTextContract.parse(readType.getText())
        : readDeclaredTypeTextLayerAdapter({ node: typeNode }),
    ...(typeRef === undefined ? {} : { typeRef }),
    ...(typeArgs === undefined || typeArgs.length === 0 ? {} : { typeArgs }),
  };
};
