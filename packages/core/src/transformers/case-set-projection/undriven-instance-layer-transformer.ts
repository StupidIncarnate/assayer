/**
 * PURPOSE: Words the UNDRIVEN admission for an instance method whose class needs constructor
 *   arguments Assayer cannot build, so no instance exists to call the method on.
 *
 *   It is the undriven channel and never a gap, because no harness closes it today. A harness key can
 *   only supply the parameters of an entry's own signature. A key under `constructor` feeds the
 *   constructor's own test and is not used to build the instance an instance method runs on. A gap
 *   would tell the reader to write a harness that changes nothing for this method.
 *
 *   The text names the constructor parameters Assayer refused and the fixes that work now: a
 *   parameter type Assayer can build, or a method that needs no instance. It says "not driven", never
 *   "cannot be driven", because every such method waits on an Assayer feature.
 *
 *   `refused` is absent when Assayer has no analysis of the class's constructor at all, which the text
 *   states instead of naming parameters.
 *
 * USAGE:
 * undrivenInstanceLayerTransformer({ fn, className: 'Repo', refused: [{ param: 'url', type: 'Url' }] });
 * // Returns { name: 'find', reason: '`find` is not driven: its class `Repo` needs a constructor argument…', startLine: 8, endLine: 13 }
 */
import { undrivenEntryContract } from '@assayer/shared/contracts';
import type { FunctionAnalysis, UndrivenEntry } from '@assayer/shared/contracts';

export const undrivenInstanceLayerTransformer = ({
  fn,
  className,
  refused,
}: {
  fn: FunctionAnalysis;
  className: string;
  refused?: readonly { param: string; type: string }[] | undefined;
}): UndrivenEntry => {
  const { name } = fn.entry;
  const lead = `\`${name}\` is not driven: its class \`${className}\` needs`;
  const staticFix =
    `make \`${name}\` a static method, or a plain function that takes what it needs as parameters, ` +
    'since neither needs an instance';

  const reason =
    refused === undefined || refused.length === 0
      ? `${lead} constructor arguments, and Assayer has no analysis of that constructor's parameters, so it ` +
        `cannot build an instance to call \`${name}\` on. To test \`${name}\` now, ${staticFix}.`
      : `${lead} ${refused.length === 1 ? 'a constructor argument' : 'constructor arguments'} Assayer cannot build, ` +
        `${refused.map((entry) => `\`${entry.param}: ${entry.type}\``).join(', ')}, so there is no instance to call ` +
        `\`${name}\` on. Assayer builds each constructor argument from its declared type, the way it builds a ` +
        `function's inputs: a scalar, a union, an array, or an object shape whose every property is one of those. ` +
        `A harness cannot supply ${refused.length === 1 ? 'it' : 'them'} yet. A harness key under \`constructor\` gives the constructor's own test ` +
        `its inputs, and Assayer does not use those to build the instance \`${name}\` runs on. To test ` +
        `\`${name}\` now, declare ${refused.length === 1 ? 'that parameter' : 'those parameters'} with a type ` +
        `Assayer can build, or ${staticFix}.`;

  return undrivenEntryContract.parse({
    name,
    reason,
    startLine: fn.entry.line,
    endLine: Math.max(fn.entry.line, ...fn.exits.map((exit) => exit.line)),
  });
};
