/**
 * PURPOSE: Reads every decorator a class carries, in source order: the class's own, then each
 *   member's, then those on a member's parameters. A decorator and its arguments run once, when the
 *   class is defined, so `handle-class` walks them under the scope the class sits in, never under a
 *   constructor or method. The walk reaches no decorator any other way, because a method's decorators
 *   are not part of its body.
 *
 *   Any node that is not a class has no decorators, so it reads as an empty list.
 *
 * USAGE:
 * readDecoratorsLayerTransformer({ node: classDeclaration });
 * // Returns [the decorator of `@d(c ? 1 : 2)`] for a class with that one decorator
 */
import { Node } from '#gateway/npm/ts-morph';
import type { Decorator } from '#gateway/npm/ts-morph';

export const readDecoratorsLayerTransformer = ({ node }: { node: Node }): Decorator[] => {
  if (!Node.isClassDeclaration(node) && !Node.isClassExpression(node)) {
    return [];
  }

  return [
    ...(Node.isDecoratable(node) ? node.getDecorators() : []),
    ...node.getMembers().flatMap((member) => [
      ...(Node.isDecoratable(member) ? member.getDecorators() : []),
      ...(Node.isParametered(member)
        ? member.getParameters().flatMap((param) => param.getDecorators())
        : []),
    ]),
  ];
};
