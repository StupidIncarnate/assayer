/**
 * PURPOSE: Reads WHERE a branch operand's value entered the program, for the one source that makes a
 *   scope nothing can call drivable anyway: the process environment. It answers the environment
 *   variable's NAME plus the pure steps between the read and the operand, or nothing at all.
 *
 *   It is a SIBLING of `read-operand-type`, not a change to it, because they answer different
 *   questions from different evidence. `read-operand-type` says what DOMAIN a value is drawn from off
 *   the type graph. This adds only the SOURCE, which no type can supply, and the steps a case runs
 *   backwards to put the operand on the arm it wants (`env-encode`).
 *
 *   The operand is either the read itself, written in place (`process.env.MODE === 'production'`,
 *   `Number(process.env.SIZE) > 5`), or an identifier bound by a same-file `const`. `read-env-chain`
 *   follows any binding, through further `const` bindings, down to one `process.env.<NAME>` read, and
 *   keeps every step it can invert: a `??` fallback, an `x === undefined ? undefined : …` guard,
 *   `Number(x)`, a comparison with a literal, `x.split('<literal>')` and `xs.map(f)`. Anything else on
 *   the way stays unrecognized and therefore honestly undriven: `parseInt(x, 10)`, a hand-written
 *   parser, a template string. Guessing an inverse for one of those would put a FAILING case against
 *   correct code, which reads as the analyzer being wrong.
 *
 * USAGE:
 * readEnvOperandLayerTransformer({ node: readout.operandNode });
 * // Returns { name: 'VALUE', steps: [{ kind: 'number' }] } for `const value = Number(process.env.VALUE)`,
 * //   or undefined
 */
import type { Node } from '#gateway/npm/ts-morph';

import type { EnvOperandReadout } from '../../contracts/env-operand-readout/env-operand-readout-contract';
import { readEnvChainLayerTransformer } from './read-env-chain-layer-transformer';

export const readEnvOperandLayerTransformer = ({ node }: { node: Node }): EnvOperandReadout | undefined =>
  readEnvChainLayerTransformer({ node, seen: [] });
