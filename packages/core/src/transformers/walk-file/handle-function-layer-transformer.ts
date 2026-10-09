/**
 * PURPOSE: Handles a function-like — the scope boundary. It opens a scope record carrying the
 *   signature, then descends the body with a context whose scope path EXTENDS by its name and whose
 *   guard path RESETS to empty. That reset is the whole rule: a function declared inside an `if`
 *   arm is only *defined* under that condition, its internal branches are not *guarded* by it.
 *
 *   Because it takes the node rather than finding it, every callable shape reuses it untouched —
 *   a class method, a nested helper, a constructor and a callback are all just this handler at a
 *   different depth. That is what collapses the old rung matrix, where each host scope needed its
 *   own near-copy of the derivation. This file owns the FunctionLikeNode family; widening the
 *   analyzer to a new callable shape means adding it here and routing it in `dispatch-node`.
 *
 *   A parameter's default value runs inside this scope too, so it is walked here, under the same
 *   context as the body, and a ternary in it is a branch of this function. A written constructor
 *   walks its class's instance field initializers the same way, because construction runs them.
 *
 * USAGE:
 * handleFunctionLayerTransformer({ node: functionDeclaration, context });
 * // Returns a HandlerResult opening the function's scope and descending its body
 */
import type {
  ArrowFunction,
  ConstructorDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  SetAccessorDeclaration,
} from '#gateway/npm/ts-morph';

import { Node } from '#gateway/npm/ts-morph';

import { exitNodeContract, paramDescriptorContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../contracts/probe-site/probe-site-contract';
import { scopeRecordContract } from '../../contracts/scope-record/scope-record-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../contracts/walk-node/walk-node-contract';
import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';
import { coverageIdTransformer } from '../coverage-id/coverage-id-transformer';
import { exitCoverageIdTransformer } from '../exit-coverage-id/exit-coverage-id-transformer';
import { typeDescriptorTransformer } from '../type-descriptor/type-descriptor-transformer';
import { typeTextTransformer } from '../type-text/type-text-transformer';
import { walkContextTransformer } from '../walk-context/walk-context-transformer';
import { handleBlockLayerTransformer } from './handle-block-layer-transformer';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';
import { readAccountedLayerTransformer } from './read-accounted-layer-transformer';
import { readConditionalExitLayerTransformer } from './read-conditional-exit-layer-transformer';
import { readConditionTreeLayerTransformer } from './read-condition-tree-layer-transformer';
import { readEntryAccessLayerTransformer } from './read-entry-access-layer-transformer';
import { readExportFlagLayerTransformer } from './read-export-flag-layer-transformer';
import { readFunctionNameLayerTransformer } from './read-function-name-layer-transformer';
import { readInstanceInitializersLayerTransformer } from './read-instance-initializers-layer-transformer';
import { readDeclaredTypeTextLayerTransformer } from './read-declared-type-text-layer-transformer';
import { readTypeFactLayerTransformer } from './read-type-fact-layer-transformer';
import { unwrapParenthesesLayerTransformer } from './unwrap-parentheses-layer-transformer';

// The predicate kinds carrying a real COMPARISON — the operand's value or its length measured against
// a threshold. A predicate signature is published ONLY when every leaf of the body's returned
// condition is one of these; a `truthy`/`falsy`/`unrecognized` leaf (a bare `return flag`,
// `return "x"`, or a nested call) constrains nothing, so a caller composing its guard against it would
// gain nothing over the opaque leaf it began with. Read as strings, exactly as `type-to-range` reads a
// predicate kind.
const COMPARISON_PREDICATE_KINDS = new Set([
  'eq',
  'neq',
  'length-eq',
  'length-neq',
  'length-gt',
  'length-gte',
  'length-lt',
  'length-lte',
  'gt',
  'gte',
  'lt',
  'lte',
]);

export type FunctionLikeNode =
  | FunctionDeclaration
  | ArrowFunction
  | FunctionExpression
  | MethodDeclaration
  | ConstructorDeclaration
  | GetAccessorDeclaration
  | SetAccessorDeclaration;

export const handleFunctionLayerTransformer = ({
  node,
  context,
}: {
  node: FunctionLikeNode;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerTransformer> => {
  const { name, anonymous } = readFunctionNameLayerTransformer({ node });
  const exported = readExportFlagLayerTransformer({ node, context });
  // Read from the context the CLASS handed down, before the scope below clears it.
  const access = readEntryAccessLayerTransformer({ node, context });

  // Optionality and rest-ness are read HERE, off the parameter, because that is the only node that
  // knows them: the checker widens `report?: (m: string) => void` to the same type a required
  // parameter declares, so nothing downstream of the type could tell that omitting it is a legal call.
  // Carried only when true, so a plain required parameter reads exactly as it always did.
  //
  // The parameter's own type NODE travels with its type, because the checker alone cannot render a
  // declaration `any` absorbed (`db: Db | string`, §5.10) — and a gap invoicing a type the signature
  // does not declare is text nobody can act on.
  const declaredParams = node.getParameters().map((param) => {
    const typeNode = param.getTypeNode();
    const type = typeDescriptorTransformer({
      fact: readTypeFactLayerTransformer({
        type: param.getType(),
        ...(typeNode === undefined ? {} : { typeNode }),
      }),
    });
    // The SOURCE's own name for the type, carried only where the descriptor cannot reproduce it. An
    // anonymous object with no `typeName` (an inline `{ a: string; write: () => void }`) renders as its
    // full braced property list, and pasting THAT into a P1 invoice buries the one fact the reader needs
    // under every property the shape declares. What the descriptor WILL render is the comparison, and
    // for an opaque REFERENCE that is the declaration's bare name — a consume-time overlay replaces it
    // with the shape it names, and `Box<string>` loses its argument the moment it does. Checker-rendered,
    // never span text (§5.1), and omitted wherever the descriptor already says it, so an ordinary
    // parameter serializes exactly as it always did.
    const declared = typeNode === undefined ? undefined : readDeclaredTypeTextLayerTransformer({ node: typeNode });
    const rendered =
      type.kind === 'unknown' && type.typeRef !== undefined ? type.typeRef : typeTextTransformer({ type });
    const declaredText = declared === undefined || declared === rendered ? undefined : declared;

    return paramDescriptorContract.parse({
      name: param.getName(),
      type,
      ...(declaredText === undefined ? {} : { declaredText }),
      ...(param.isOptional() ? { optional: true } : {}),
      ...(param.isRestParameter() ? { rest: true } : {}),
    });
  });
  const returnTypeNode = node.getReturnTypeNode();
  const returnType = typeDescriptorTransformer({
    fact: readTypeFactLayerTransformer({
      type: node.getReturnType(),
      ...(returnTypeNode === undefined ? {} : { typeNode: returnTypeNode }),
    }),
  });

  const scoped = walkContextTransformer({ context, scopeSegment: name, params: declaredParams, exported });

  // A parameter's DEFAULT value is code of this function: it runs inside the function's scope, before
  // the body, each time a caller leaves that argument out. So it descends under the function's own
  // context, and a ternary there is a branch of this function (`handle-ternary`). A call or an arrow
  // function in any other default is walked the same way.
  const paramInitializers = node.getParameters().map((param) => param.getInitializer());
  const preludeContext = walkContextTransformer({ context: scoped, tail: false });
  const defaults = paramInitializers.flatMap((initializer) =>
    initializer === undefined ? [] : [{ node: initializer, context: preludeContext }],
  );
  // A written constructor runs its class's instance field initializers too, after the defaults and
  // before its own body, every time the class is constructed. So they descend under this scope's
  // context, and the class walks none of them itself (`read-instance-initializers`). An overload
  // signature has no body and runs nothing.
  const fieldInitializers = (
    Node.isConstructorDeclaration(node) && node.hasBody()
      ? readInstanceInitializersLayerTransformer({ node: node.getParentOrThrow() })
      : []
  ).map((initializer) => ({ node: initializer, context: preludeContext }));
  // A default that IS a ternary marks its parameter, so a derived case leaves that argument out and the
  // branch runs (`applied-params`).
  const params = declaredParams.map((param, index) => {
    const initializer = paramInitializers[index];

    return initializer !== undefined && Node.isConditionalExpression(unwrapParenthesesLayerTransformer({ node: initializer }))
      ? paramDescriptorContract.parse({ ...param, branchingDefault: true })
      : param;
  });
  const body = node.getBody();

  const block = body !== undefined && Node.isBlock(body) ? body : undefined;
  const statements = block === undefined ? [] : block.getStatements();

  // The block handler owns sequential flow, so it — not this handler — is where a value-flow tail
  // (`const x = cond ? y : z; return x`) collapses to a per-arm split. When it does, it hands back the
  // split's branches/exits/probe sites/nodes as well as its descents, and this scope CLAIMS them via
  // `opensScope` exactly as it claims a concise-arrow ternary's. A plain block emits none, so merging
  // is a no-op there. No double-count: a value-flow tail return is `readAccounted`, so `falls` is false
  // and no end exit is added.
  const blockResult = block === undefined ? undefined : handleBlockLayerTransformer({ statements, context: scoped });

  // A concise arrow whose body IS a ternary (`(n) => n > 5 ? 'big' : 'small'`) never passes through
  // `handle-exit` — this handler emits its return exit. When that body is a ternary, `read-conditional-exit`
  // OWNS the split instead: the arm exits, the branch, the probe sites and descents it hands back
  // REPLACE the single-return path below, and the emitted branch/exits are claimed by the scope this
  // handler opens.
  const conciseBodyReadout =
    block === undefined && body !== undefined
      ? readConditionalExitLayerTransformer({ expression: body, kind: 'return', context: scoped })
      : undefined;
  const conciseTernary = conciseBodyReadout?.conditional === true ? conciseBodyReadout.result : undefined;

  // A boolean predicate whose WHOLE body returns one comparison (`return n > 50`, or a concise arrow
  // that IS that comparison) publishes its decomposed condition as a signature. A caller's opaque
  // `if (pred(x))` leaf composes against this — the callee's comparison rebased onto the argument the
  // caller passed — turning two identical derived cases into the sound pair. Gated to a SINGLE
  // comparison return: any leaf that is not a real comparison carries no constraint, so no signature is
  // published and the caller's leaf stays opaque. The function must also return a BOOLEAN: the
  // condition reader reads a bare `xs.length` as the test `xs.length !== 0`, which is right where the
  // length decides a branch, but `return xs.length` returns the count itself, not a comparison.
  const onlyStatement = statements.length === 1 ? statements[0] : undefined;
  const returnStatement =
    onlyStatement !== undefined && Node.isReturnStatement(onlyStatement) ? onlyStatement : undefined;
  const predicateReturnExpr =
    block === undefined ? (body !== undefined && !Node.isBlock(body) ? body : undefined) : returnStatement?.getExpression();
  const predicateReadout =
    predicateReturnExpr === undefined
      ? undefined
      : readConditionTreeLayerTransformer({
          condition: predicateReturnExpr,
          context: scoped,
          branchCoverageId: coverageIdTransformer({ scopePath: scoped.scopePath, segment: 'predicate' }),
          path: [],
        });
  const predicateSignature =
    predicateReadout !== undefined &&
    returnType.kind === 'boolean' &&
    conditionLeavesTransformer({ condition: predicateReadout.condition }).every((leaf) =>
      COMPARISON_PREDICATE_KINDS.has(leaf.predicate.kind),
    )
      ? predicateReadout.condition
      : undefined;

  // Three shapes: no body at all (an overload signature) exits nowhere; a concise arrow
  // (`(n) => n`) has no statement to return from, so its body IS the single exit; a block
  // simply ENDING is an exit, unless its last statement already accounts for every path.
  //
  // Each exit's PROBE SITE rides with it, minted from the same expression as its id — the property
  // every site in this walk holds, and the reason a runtime observation cannot key under an id the
  // analyzer never produced. The two shapes are observed differently because they ARE different: a
  // concise arrow's exit is an expression, so the probe wraps it and passes its value through; a
  // block simply ending has no expression at all, so the probe is appended as its last statement.
  const returnCoverageId = exitCoverageIdTransformer({ kind: 'return', guardPath: [], scopePath: scoped.scopePath });
  const endCoverageId = exitCoverageIdTransformer({ kind: 'exit', guardPath: [], scopePath: scoped.scopePath });
  const falls = block !== undefined && !readAccountedLayerTransformer({ node: statements.at(-1) });
  const exits =
    conciseTernary === undefined
      ? block === undefined
        ? body === undefined
          ? []
          : [
              exitNodeContract.parse({
                coverageId: returnCoverageId,
                kind: 'return',
                guardPath: [],
                line: body.getStartLineNumber(),
              }),
            ]
        : [
            ...(falls
              ? [
                  exitNodeContract.parse({
                    coverageId: endCoverageId,
                    kind: 'implicit',
                    guardPath: [],
                    line: block.getEndLineNumber(),
                  }),
                ]
              : []),
            ...(blockResult?.exits ?? []),
          ]
      : conciseTernary.exits;
  const probeSites =
    conciseTernary === undefined
      ? block === undefined
        ? body === undefined
          ? []
          : [
              probeSiteContract.parse({
                id: returnCoverageId,
                kind: 'exit',
                start: body.getStart(),
                end: body.getEnd(),
              }),
            ]
        : [
            ...(falls
              ? [
                  probeSiteContract.parse({
                    id: endCoverageId,
                    kind: 'complete',
                    start: block.getStart(),
                    end: block.getEnd(),
                  }),
                ]
              : []),
            ...(blockResult?.probeSites ?? []),
          ]
      : conciseTernary.probeSites;

  return handlerResultLayerTransformer({
    branches: conciseTernary === undefined ? (blockResult?.branches ?? []) : conciseTernary.branches,
    exits,
    probeSites,
    nodes: [
      walkNodeContract.parse({
        kind: node.getKindName(),
        scopePath: scoped.scopePath,
        name,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
        handled: true,
      }),
      ...(conciseTernary === undefined ? (blockResult?.nodes ?? []) : conciseTernary.nodes),
    ],
    opensScope: scopeRecordContract.parse({
      scopePath: scoped.scopePath,
      name,
      anonymous,
      kind: 'function',
      exported,
      access,
      params,
      returnType,
      startLine: node.getStartLineNumber(),
      endLine: node.getEndLineNumber(),
      branches: [],
      exits: [],
      ...(predicateSignature === undefined ? {} : { predicateSignature }),
    }),
    descents: [
      ...defaults,
      ...fieldInitializers,
      ...(conciseTernary === undefined
        ? block === undefined
          ? body === undefined
            ? []
            : [{ node: body, context: scoped }]
          : (blockResult?.descents ?? [])
        : conciseTernary.descents),
    ],
  });
};
