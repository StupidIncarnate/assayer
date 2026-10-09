/**
 * PURPOSE: Reads the initializers of a class's INSTANCE fields, in source order. Each one runs every
 *   time the class is constructed, before the constructor's own body, so it is code of the
 *   constructor's scope and not of the scope the class sits in. A static field's initializer runs once,
 *   when the class itself is defined, so it is left out.
 *
 *   `handle-class` and `handle-function` both read the list, so the two can never disagree about which
 *   initializers a constructor owns: the class walks none of them itself, and the constructor (written
 *   or implicit) walks all of them.
 *
 *   Any node that is not a class has no instance fields, so it reads as an empty list.
 *
 * USAGE:
 * readInstanceInitializersLayerTransformer({ node: classDeclaration });
 * // Returns [the initializer of `label = flag ? 'a' : 'b'`] for a class with that one instance field
 */
import { Node } from '#gateway/npm/ts-morph';
import type { Expression } from '#gateway/npm/ts-morph';

export const readInstanceInitializersLayerTransformer = ({ node }: { node: Node }): Expression[] =>
  !Node.isClassDeclaration(node) && !Node.isClassExpression(node)
    ? []
    : node.getMembers().flatMap((member) => {
        if (!Node.isPropertyDeclaration(member) || member.isStatic()) {
          return [];
        }
        const initializer = member.getInitializer();

        return initializer === undefined ? [] : [initializer];
      });
