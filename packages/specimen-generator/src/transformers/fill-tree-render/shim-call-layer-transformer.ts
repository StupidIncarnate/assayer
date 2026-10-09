/**
 * PURPOSE: Writes a shim as the call to the builtin it stands for, from the expressions that fill its
 * holes in declaration order. A `method` shim becomes `receiver.name(args)`, a `getter` shim becomes
 * `receiver.name`, and a `call` shim becomes `name(args)`. The first hole is the receiver. The
 * TypeScript factory wraps a receiver in parentheses when its precedence needs them. Reach for this
 * when the node being rendered comes from a shim declaration, not from a syntax's own code.
 *
 * USAGE:
 * shimCallLayerTransformer({ instance, fills: [receiverNode, indexNode] });
 * // Returns the node for `receiver.at(index)` when the shim's form is a method named 'at'
 */
import ts from '#gateway/npm/typescript';

import type { SyntaxInstance } from '../../contracts/syntax-instance/syntax-instance-contract';

export const shimCallLayerTransformer = ({
  instance,
  fills,
}: {
  instance: SyntaxInstance;
  fills: readonly ts.Expression[];
}): ts.Expression => {
  const { form } = instance.syntax;
  if (form === undefined) {
    throw new Error(
      `The shim '${instance.syntax.name}' has no form, so the generator cannot write a call to it. Add form: { kind, name } to the shim declaration.`,
    );
  }

  if (form.kind === 'call') {
    const [first = '', ...rest] = form.name.split('.');
    const callee = rest.reduce<ts.Expression>(
      (object, part) => ts.factory.createPropertyAccessExpression(object, part),
      ts.factory.createIdentifier(first),
    );
    return ts.factory.createCallExpression(callee, undefined, fills);
  }

  const [receiver, ...args] = fills;
  if (receiver === undefined) {
    throw new Error(
      `The shim '${instance.syntax.name}' is written as a ${form.kind} on its first hole, but it has no holes. Add the receiver as the first parameter of its code.`,
    );
  }
  const access = ts.factory.createPropertyAccessExpression(receiver, form.name);

  return form.kind === 'getter' ? access : ts.factory.createCallExpression(access, undefined, args);
};
