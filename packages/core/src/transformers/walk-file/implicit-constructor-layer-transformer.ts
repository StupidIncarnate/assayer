/**
 * PURPOSE: Builds the implicit constructor of a class that declares none but initializes an instance
 *   field. TypeScript supplies that constructor, and it runs every instance field initializer each time
 *   the class is constructed. So it is a real scope, with no node of its own: `handle-class` hands it
 *   to the walk as an implicit scope, and a ternary in a field initializer is a branch of it, driven by
 *   constructing the class.
 *
 *   It reads exactly like a written constructor that takes no parameters: the scope is named
 *   `constructor`, reached through `new` on the class, and owes one implicit exit for finishing. That
 *   exit has no statement to append a probe to, so its probe wraps the LAST initializer: initializers
 *   run in source order, so the probe fires once every one of them has run.
 *
 * USAGE:
 * implicitConstructorLayerTransformer({ classNode, className: 'Labeller', context, initializers, lastInitializer });
 * // Returns a HandlerResult opening the `constructor` scope and descending each initializer in it
 */
import type { ClassDeclaration, ClassExpression, Expression } from '#gateway/npm/ts-morph';

import { entryAccessContract, exitNodeContract } from '@assayer/shared/contracts';

import type { HandlerResult } from '../../contracts/handler-result/handler-result-contract';
import { probeSiteContract } from '../../contracts/probe-site/probe-site-contract';
import { scopeRecordContract } from '../../contracts/scope-record/scope-record-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { exitCoverageIdTransformer } from '../exit-coverage-id/exit-coverage-id-transformer';
import { typeDescriptorTransformer } from '../type-descriptor/type-descriptor-transformer';
import { walkContextTransformer } from '../walk-context/walk-context-transformer';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';
import { readTypeFactLayerTransformer } from './read-type-fact-layer-transformer';

// The name a written constructor's scope carries too (`read-function-name`), so an implicit and a
// written constructor are the same entry to everything downstream.
const CONSTRUCTOR_NAME = 'constructor';

export const implicitConstructorLayerTransformer = ({
  classNode,
  className,
  context,
  initializers,
  lastInitializer,
}: {
  classNode: ClassDeclaration | ClassExpression;
  className: string;
  context: WalkContext;
  initializers: Expression[];
  lastInitializer: Expression;
}): HandlerResult => {
  const scoped = walkContextTransformer({ context, scopeSegment: CONSTRUCTOR_NAME, params: [], exported: context.exported });
  const exitId = exitCoverageIdTransformer({ kind: 'exit', guardPath: [], scopePath: scoped.scopePath });
  // An initializer is an expression, so reaching its end never ends the scope.
  const initializerContext = walkContextTransformer({ context: scoped, tail: false });

  return handlerResultLayerTransformer({
    exits: [exitNodeContract.parse({ coverageId: exitId, kind: 'implicit', guardPath: [], line: classNode.getEndLineNumber() })],
    probeSites: [
      probeSiteContract.parse({ id: exitId, kind: 'exit', start: lastInitializer.getStart(), end: lastInitializer.getEnd() }),
    ],
    opensScope: scopeRecordContract.parse({
      scopePath: scoped.scopePath,
      name: CONSTRUCTOR_NAME,
      kind: 'function',
      exported: context.exported,
      access: entryAccessContract.parse({ kind: 'constructor', className }),
      params: [],
      returnType: typeDescriptorTransformer({ fact: readTypeFactLayerTransformer({ type: classNode.getType() }) }),
      startLine: classNode.getStartLineNumber(),
      endLine: classNode.getEndLineNumber(),
      branches: [],
      exits: [],
    }),
    descents: initializers.map((initializer) => ({ node: initializer, context: initializerContext })),
  });
};
