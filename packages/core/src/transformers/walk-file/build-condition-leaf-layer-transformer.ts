/**
 * PURPOSE: Builds ONE condition leaf from a readout: the operand's name or object-member root, where its
 *   value comes from (an environment variable, read in place or through a `const`, a command-line
 *   read, a same-file constant, a call), its type, and the predicate. `read-condition-tree` calls it for every leaf it reads, so every leaf of a condition
 *   carries the same facts no matter which connective put it there. `read-nullish-leaf` is the sibling
 *   that reads a value-position `??` operand.
 *
 *   `site` is the expression the leaf's probe wraps. A leaf with no expression of its own to wrap, such
 *   as the non-nullish test `a ?? b` makes on `a` while `a`'s span already carries its truthiness probe,
 *   is built without one: the instrumenter wraps a span once.
 *
 * USAGE:
 * buildConditionLeafLayerTransformer({ readout: readConditionLayerTransformer({ condition }), context, id, site: condition });
 * // Returns { condition: { kind: 'leaf', id, operandParamName: 'x', … }, sites: [{ id, kind: 'cond', start, end }] }
 */
import { Node } from '#gateway/npm/ts-morph';

import { conditionNodeContract } from '@assayer/shared/contracts';
import type { Coverage } from '@assayer/shared/contracts';

import type { ConditionReadout } from '../../contracts/condition-readout/condition-readout-contract';
import { conditionTreeReadoutContract } from '../../contracts/condition-tree-readout/condition-tree-readout-contract';
import type { ConditionTreeReadout } from '../../contracts/condition-tree-readout/condition-tree-readout-contract';
import { probeSiteContract } from '../../contracts/probe-site/probe-site-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { envOperandKeyTransformer } from '../env-operand-key/env-operand-key-transformer';
import { envStepsTypeTransformer } from '../env-steps-type/env-steps-type-transformer';
import { readArgvOperandLayerTransformer } from './read-argv-operand-layer-transformer';
import { readConstOperandLayerTransformer } from './read-const-operand-layer-transformer';
import { readEnvOperandLayerTransformer } from './read-env-operand-layer-transformer';
import { readOperandTypeLayerTransformer } from './read-operand-type-layer-transformer';

export const buildConditionLeafLayerTransformer = ({
  readout,
  context,
  id,
  site,
}: {
  readout: ConditionReadout;
  context: WalkContext;
  id: Coverage['id'];
  site?: Node;
}): ConditionTreeReadout => {
  // WHERE the operand's value came from — a different question from what its type is, asked of a
  // different reader. Recorded wherever it is true; whether an entry can be driven through it is
  // policy, and policy lives in the projections. An environment read also decides the operand's TYPE:
  // the analyzer loads no Node types, so the checker types every step built on `process.env` as `any`,
  // while the steps themselves say what Node declares (`env-steps-type`). A `typeof` read asks for the
  // runtime tag rather than the value, and its unset tag (`'undefined'`) is not a value the steps
  // model, so it is not read as an environment operand.
  const envRead =
    readout.operandIsTypeof === true ? undefined : readEnvOperandLayerTransformer({ node: readout.operandNode });

  // A command-line read is a third source. No case can set it, so it never makes a branch drivable,
  // but the value it holds when a case runs is known, which is what picks the fallback arm of an
  // un-steerable branch (`condition-default-value`). A `typeof` read of it is kept: running the read
  // forward gives its runtime tag too.
  const argvRead = envRead === undefined ? readArgvOperandLayerTransformer({ node: readout.operandNode }) : undefined;

  // Whether the operand is WELDED to a same-file constant — a value the analyzer EVALUATES rather than
  // an input a case sets. A scalar `const` welds a value, an array `const` welds its length. Recorded
  // wherever true; the derivation reads it as a single-value domain and drives the live arm.
  const constOperand = readConstOperandLayerTransformer({ node: readout.operandNode });

  // A CALL operand reads as opaque `truthy` here, because a single-file parse cannot type the callee.
  // Anchoring the call's position — the SAME coordinate its call site records — is the foreign key a
  // later compose pass joins on to swap this leaf for the callee's own predicate.
  // An environment read written in place as a call (`Number(process.env.X)`) is already understood,
  // so it carries no call position for a compose pass to swap.
  const callPosition = envRead === undefined && Node.isCallExpression(readout.operandNode)
    ? readout.operandNode.getSourceFile().getLineAndColumnAtPos(readout.operandNode.getStart())
    : undefined;

  // A plain identifier is its own param; an object-member read (`config.mode`) names its ROOT param
  // instead, alongside the property path and type-ref the stub stitch joins on. The operand's TYPE is
  // still read off the operand node itself (the property's type), never off the root param — passing
  // the root as `name` would return the whole object descriptor instead of `string`.
  //
  // An environment read written IN PLACE (`process.env.MODE === 'x'`) is no object member a case
  // arranges: `process` is no parameter, and `env` is no property of one. It is named by the read and
  // its steps (`env-operand-key`), which is also the name an admission prints, and it carries no
  // property path or type reference for the stub stitch to join on.
  const inPlaceEnv = envRead !== undefined && readout.operandName === undefined;
  const operandParamName = inPlaceEnv
    ? envOperandKeyTransformer({ name: envRead.name, steps: envRead.steps })
    : (readout.operandName ?? readout.operandRootName);

  return conditionTreeReadoutContract.parse({
    condition: conditionNodeContract.parse({
      kind: 'leaf',
      id,
      ...(operandParamName === undefined ? {} : { operandParamName }),
      ...(inPlaceEnv || readout.operandPropertyPath === undefined ? {} : { operandPropertyPath: readout.operandPropertyPath }),
      ...(inPlaceEnv || readout.operandTypeRef === undefined ? {} : { operandTypeRef: readout.operandTypeRef }),
      ...(readout.operandIsTypeof === undefined ? {} : { operandIsTypeof: readout.operandIsTypeof }),
      ...(envRead === undefined ? {} : { operandEnvVarName: envRead.name }),
      ...(envRead === undefined || envRead.steps.length === 0 ? {} : { operandEnvSteps: envRead.steps }),
      ...(argvRead === undefined ? {} : { operandArgvRead: argvRead }),
      ...(constOperand?.value === undefined ? {} : { operandConstValue: constOperand.value }),
      ...(constOperand?.length === undefined ? {} : { operandConstLength: constOperand.length }),
      ...(callPosition === undefined ? {} : { operandCallPosition: { line: callPosition.line, column: callPosition.column } }),
      operandType:
        envRead === undefined
          ? readOperandTypeLayerTransformer({
              node: readout.operandNode,
              context,
              ...(readout.operandName === undefined ? {} : { name: readout.operandName }),
            })
          : envStepsTypeTransformer({ steps: envRead.steps }),
      predicate: readout.predicate,
    }),
    // The site wraps the LEAF EXPRESSION as written, not the operand the readout picked out. Wrapping in
    // place is what preserves short-circuit: an unevaluated leaf never calls its probe, so absent stays
    // distinguishable from false.
    sites: site === undefined ? [] : [probeSiteContract.parse({ id, kind: 'cond', start: site.getStart(), end: site.getEnd() })],
  });
};
