/**
 * PURPOSE: Turns a type's text into what the generator knows about it. It lists only the base types
 * in typeListStatics and derives `readonly X[]` and `X | undefined` from them, so a composite type
 * needs no entry of its own. An array has no env text. Reach for this when a leaf needs its known value or its env and
 * external source text.
 *
 * USAGE:
 * typeInfoTransformer({ typeText: 'readonly number[]' });
 * // Returns { known: [10, 20, 30], samples: [[10, 20, 30]], external: 'process.argv.slice(2).map(Number)' }
 */
import { typeInfoContract } from '../../contracts/type-info/type-info-contract';
import type { TypeInfo } from '../../contracts/type-info/type-info-contract';
import { typeListStatics } from '../../statics/type-list/type-list-statics';

export const typeInfoTransformer = ({ typeText }: { typeText: string }): TypeInfo => {
  const arrayMatch = /^readonly (\w+)\[\]$/u.exec(typeText);
  const maybeMatch = /^(\w+) \| undefined$/u.exec(typeText);
  const baseName = arrayMatch?.[1] ?? maybeMatch?.[1] ?? typeText;
  const base = Object.entries(typeListStatics).find(([name]) => name === baseName)?.[1];

  if (base === undefined) {
    throw new Error(
      `Type '${typeText}' is not a type the generator knows. It knows ${Object.keys(typeListStatics).join(', ')}, and \`readonly X[]\` and \`X | undefined\` for each of them. Add the base type to typeListStatics, or change the hole's type.`,
    );
  }

  const samples = Object.values(base.samples);

  if (arrayMatch) {
    return typeInfoContract.parse({
      known: samples,
      samples: [samples],
      external: base.externalArray,
    });
  }

  if (maybeMatch) {
    return typeInfoContract.parse({
      known: base.known,
      samples,
      env: `process.env.KEY === undefined ? undefined : ${base.env}`,
      external: `process.argv[2] === undefined ? undefined : ${base.external}`,
    });
  }

  return typeInfoContract.parse({
    known: base.known,
    samples,
    env: base.env,
    external: base.external,
  });
};
