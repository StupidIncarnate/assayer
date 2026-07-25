/**
 * PURPOSE: Handles an `interface` or `type` declaration — records ONE declared shape as a flat
 *   file-level fact (never scope-claimed, like a module edge). A declaration is a fact about the FILE
 *   whether or not any signature mentions it, which is the whole reason it is read here rather than
 *   gathered off the params and return types the walk already reads: a shape only a sibling's reader
 *   ever names is otherwise nowhere in the file's declared surface, and every name-keyed artifact
 *   downstream — the stub index, the merged stub view, the object arrange — has no shape to key on.
 *
 *   The shape comes from the SAME type reader every param and return type goes through
 *   (`read-type-fact` → `type-descriptor`), so `interface Config` and `type Config = { … }` are read
 *   identically and no second type classifier exists. It emits whatever the declaration denotes,
 *   including an alias to a primitive, a union, or a callable; naming an object shape is
 *   `collect-named-object-types`' job, not this handler's.
 *
 *   The declared NAME rides beside the descriptor, because that is the only fact the descriptor cannot
 *   hold for itself: an object descriptor carries its own `typeName`, while `type Id = string` denotes a
 *   descriptor with no name slot, and a name-keyed resolution over the file's declared surface would
 *   miss every alias to a scalar or a union.
 *
 *   It descends its children exactly as an unclaimed node would, so nothing inside a declaration is
 *   dropped, and it opens no scope: a type declaration holds no control flow.
 *
 * USAGE:
 * handleTypeDeclarationLayerAdapter({ node: interfaceDeclaration, context });
 * // Returns a HandlerResult with one declaredShape and its children as descents
 */
import { Node } from 'ts-morph';
import type { EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration } from 'ts-morph';

import { declaredShapeContract } from '../../../contracts/declared-shape/declared-shape-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { typeDescriptorTransformer } from '../../../transformers/type-descriptor/type-descriptor-transformer';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readTypeFactLayerAdapter } from './read-type-fact-layer-adapter';

export const handleTypeDeclarationLayerAdapter = ({
  node,
  context,
}: {
  node: EnumDeclaration | InterfaceDeclaration | TypeAliasDeclaration;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  // An alias's right-hand side is the declaration the type was written as, and the hermetic walk needs
  // it for the same reason a parameter does: `type BeeT = AyT` with `AyT` imported is `any` to the
  // checker, so without the node the shape carries no reference for the overlay to resolve and an alias
  // CHAIN stops one file short of the shape it names. An interface has no such node — it IS its shape.
  const typeNode = Node.isTypeAliasDeclaration(node) ? node.getTypeNode() : undefined;
  // A generic declaration's type PARAMETERS, in order — the slots a reference's type ARGUMENTS fill.
  // Names only: `T` is a placeholder, and what it stands for is decided by whoever writes `Box<string>`.
  const typeParams = Node.isEnumDeclaration(node) ? [] : node.getTypeParameters().map((param) => param.getName());

  return handlerResultLayerAdapter({
    declaredShapes: [
      declaredShapeContract.parse({
        // The declaration identifier's own name — a spelling-invariant name (§5.1), and the only place
        // an alias to a scalar or a union can carry one at all: its descriptor has no name slot.
        name: node.getName(),
        type: typeDescriptorTransformer({
          fact: readTypeFactLayerAdapter({ type: node.getType(), ...(typeNode === undefined ? {} : { typeNode }) }),
        }),
        ...(typeParams.length === 0 ? {} : { typeParams }),
      }),
    ],
    descents: node.forEachChildAsArray().map((child) => ({ node: child, context })),
  });
};
