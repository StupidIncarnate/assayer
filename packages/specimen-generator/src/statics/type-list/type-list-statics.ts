/**
 * PURPOSE: Per base type, the value a known leaf writes, three samples for an array of it (an object keyed `first`, `second`, `third`, because the lint rule against magic numbers refuses a number inside an array), and the
 * expressions an env leaf and an external leaf write. There is no env read for an array: a split of
 * an env string is never empty, so the generator does not offer `env` for an array-typed hole. The
 * generator derives `readonly X[]` and
 * `X | undefined` from these, so neither is listed.
 *
 * In `env`, the text `KEY` is the placeholder the generator replaces with the leaf's
 * name in UPPER_SNAKE case.
 *
 * USAGE:
 * typeListStatics.number.env;
 * // Returns 'Number(process.env.KEY)'
 */
export const typeListStatics = {
  number: {
    known: 3,
    samples: { first: 10, second: 20, third: 30 },
    env: 'Number(process.env.KEY)',
    external: 'Number(process.argv[2])',
    externalArray: 'process.argv.slice(2).map(Number)',
  },
  string: {
    known: 'abc',
    samples: { first: 'a', second: 'b', third: 'c' },
    env: "process.env.KEY ?? ''",
    external: "process.argv[2] ?? ''",
    externalArray: 'process.argv.slice(2)',
  },
  boolean: {
    known: true,
    samples: { first: true, second: false, third: true },
    env: "process.env.KEY === 'true'",
    external: "process.argv[2] === 'yes'",
    externalArray: "process.argv.slice(2).map((arg) => arg === 'yes')",
  },
} as const;
