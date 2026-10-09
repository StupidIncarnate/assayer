/**
 * PURPOSE: Handles a class — a NAMING scope, not an executable one. A class opens no scope record of
 *   its own; it contributes a path segment (`['Classifier', 'classify']`)
 *   and passes its export reach down to its members, which is what makes a method of an exported
 *   class an analysable entry while a bare nested function is not. Members are then just
 *   function-likes: the class rung costs this file and nothing else.
 *
 *   The one control flow a class body holds is construction: every instance field initializer runs
 *   each time the class is constructed. So those initializers belong to the constructor's scope, never
 *   to the scope the class sits in. A written constructor walks them itself. A class with none gets the
 *   constructor the language supplies, opened here as an implicit scope over them.
 *
 *   It also hands DOWN its identity and constructability, because a method is only addressable
 *   through an instance and the class is the only node that knows how to make one. A constructor
 *   with required arguments makes `constructable` false, so the case set builds each instance with
 *   arguments filled from the constructor's declared types instead of guessing at them.
 *
 *   A decorator on the class, on a member or on a member's parameter runs when the class is defined, so
 *   the class walks each one under its own context, and a ternary in its arguments is a branch of the
 *   scope the class sits in.
 *
 *   A class DECLARES a shape too — its instance type — recorded on the same flat channel an
 *   `interface`/`type` declaration uses and read through the same type reader, because a sibling that
 *   takes a `Point` needs the same answer whether `Point` is an interface or a class. Without it the
 *   reader is invoiced for a shape the file next door describes in full.
 *
 * USAGE:
 * handleClassLayerTransformer({ node: classDeclaration, context });
 * // Returns a HandlerResult descending the class's members under its name
 */
import { Node } from '#gateway/npm/ts-morph';
import type { ClassDeclaration, ClassExpression } from '#gateway/npm/ts-morph';


import { declaredShapeContract } from '../../contracts/declared-shape/declared-shape-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../contracts/walk-node/walk-node-contract';
import { typeDescriptorTransformer } from '../type-descriptor/type-descriptor-transformer';
import { walkContextTransformer } from '../walk-context/walk-context-transformer';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';
import { implicitConstructorLayerTransformer } from './implicit-constructor-layer-transformer';
import { readDecoratorsLayerTransformer } from './read-decorators-layer-transformer';
import { readInstanceInitializersLayerTransformer } from './read-instance-initializers-layer-transformer';
import { readTypeFactLayerTransformer } from './read-type-fact-layer-transformer';

export const handleClassLayerTransformer = ({
  node,
  context,
}: {
  node: ClassDeclaration | ClassExpression;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerTransformer> => {
  const name = (node.getName() ?? 'default');
  const exported = Node.isClassDeclaration(node) ? node.isExported() : context.exported;

  // No constructor at all, or one every parameter of which can be omitted, means an instance costs
  // nothing to make. `every` over no constructors is vacuously true, which is the right answer.
  const constructable = node
    .getConstructors()
    .every((ctor) =>
      ctor.getParameters().every((param) => param.isOptional() || param.hasInitializer() || param.isRestParameter()),
    );

  const scoped = walkContextTransformer({
    context,
    scopeSegment: name,
    params: [],
    exported,
    enclosingClass: { name, constructable },
  });

  // The INSTANCE shape the class declares — what a parameter typed `Point` demands. Only a NAMED class
  // declares one: an anonymous class expression has no name a reference could resolve by.
  const declaredShapes =
    Node.isClassDeclaration(node) && node.getName() !== undefined
      ? [
          declaredShapeContract.parse({
            name,
            type: typeDescriptorTransformer({ fact: readTypeFactLayerTransformer({ type: node.getType() }) }),
            ...(node.getTypeParameters().length === 0
              ? {}
              : { typeParams: node.getTypeParameters().map((param) => param.getName()) }),
          }),
        ]
      : [];

  // An instance field's initializer runs inside the constructor, every time the class is constructed,
  // so the class walks none of them itself. A written constructor walks them before its own body
  // (`handle-function`). A class without one still runs them, in the constructor the language
  // supplies, so this handler opens that constructor as an implicit scope and walks them there.
  const initializers = readInstanceInitializersLayerTransformer({ node });
  const ownedByConstructor = new Set<Node>(initializers);
  // The rest of such a field (a computed name, a type) still descends here, so nothing is dropped.
  // A decorator never descends with its member: a decorator runs when the class is defined, so the
  // class walks every one of them below, under the scope the class sits in.
  const decorators = readDecoratorsLayerTransformer({ node });
  const ownedByClass = new Set<Node>(decorators);
  const descents = node.getMembers().flatMap((member) => {
    const children = member.forEachChildAsArray();
    const kept = children.filter((child) => !ownedByConstructor.has(child) && !ownedByClass.has(child));

    return Node.isPropertyDeclaration(member) && kept.length !== children.length
      ? kept.map((child) => ({ node: child, context: scoped }))
      : [{ node: member, context: scoped }];
  });
  const decoratorDescents = decorators.map((decorator) => ({ node: decorator, context: scoped }));
  const lastInitializer = initializers.at(-1);
  const implicitConstructor =
    node.getConstructors().length > 0 || lastInitializer === undefined
      ? undefined
      : implicitConstructorLayerTransformer({
          classNode: node,
          className: name,
          context: scoped,
          initializers,
          lastInitializer,
        });

  return handlerResultLayerTransformer({
    declaredShapes,
    nodes: [
      walkNodeContract.parse({
        kind: node.getKindName(),
        scopePath: scoped.scopePath,
        name,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
        handled: true,
      }),
    ],
    descents: [...decoratorDescents, ...descents],
    ...(implicitConstructor === undefined ? {} : { implicitScopes: [implicitConstructor] }),
  });
};
