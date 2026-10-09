/**
 * PURPOSE: How a test treats each provenance (where a leaf's value comes from), and when a slot may
 * offer it. The `random` entry stays in the table. The matrix switches it off by leaving it out of
 * its enabled list.
 *
 * `test` values: `sets` means a test chooses the value. `known` means the value is written in the
 * code. `pinned` means a builtin no input decides, which a test pins inside the builtin's range.
 * `unsettable` means the value comes from outside the program and Assayer cannot set it.
 *
 * `offered` values: `params` means the slot sits in a callable with `$params`. `module-load` means
 * the slot runs at module load. `always` means every slot may use it.
 *
 * USAGE:
 * provenanceStatics.param.test;
 * // Returns 'sets'
 */
export const provenanceStatics = {
  param: { test: 'sets', offered: 'params' },
  env: { test: 'sets', offered: 'module-load' },
  literal: { test: 'known', offered: 'always' },
  const: { test: 'known', offered: 'always' },
  random: { test: 'pinned', offered: 'always' },
  external: { test: 'unsettable', offered: 'always' },
} as const;
