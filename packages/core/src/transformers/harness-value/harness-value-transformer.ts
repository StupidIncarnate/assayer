/**
 * PURPOSE: Reads ONE harness-supplied input out of the declarations a loaded harness registered, by
 *   walking the key path an arrange binding carries (`inputs.audit.report`). The read half of the route
 *   `harness-key-path` writes.
 *
 *   It reports ABSENCE rather than returning `undefined`, and that distinction is the whole point. A key
 *   the harness never declared and a key it declared as `undefined` are different facts: the first is a
 *   case that cannot run and must say which key is missing, the second is a value a human deliberately
 *   supplied. Collapsing them hands the entry a silent `undefined` argument and reports whatever the code
 *   then does as if the input had been given.
 *
 *   Several `assayerHarness` calls in one file fold into one lookup, and the LAST declaration of a key
 *   wins — the module body ran top to bottom, so the later call is the one the author left in force.
 *
 * USAGE:
 * harnessValueTransformer({ declarations, key: 'inputs.audit.report' });
 * // Returns { found: true, value: [Function] }, or { found: false } when nothing declared that key
 */

import type { HarnessDeclaration } from '../../contracts/harness-declaration/harness-declaration-contract';
import { harnessModuleStatics } from '../../statics/harness-module/harness-module-statics';

export type HarnessValueResult = { found: true; value: unknown } | { found: false };

export const harnessValueTransformer = ({
  declarations,
  key,
}: {
  declarations: readonly HarnessDeclaration[];
  key: string;
}): HarnessValueResult => {
  const [root, entry, param, ...rest] = key.split(harnessModuleStatics.keySeparator);

  if (
    root !== harnessModuleStatics.inputsRoot ||
    entry === undefined ||
    param === undefined ||
    rest.length > 0
  ) {
    return { found: false };
  }

  // `in` rather than a truthiness test, so a deliberately-declared `undefined` counts as supplied.
  const declared = declarations.flatMap((declaration) => {
    const entryInputs = declaration.inputs[entry];

    return entryInputs === undefined || !(param in entryInputs) ? [] : [{ value: entryInputs[param] }];
  });
  const last = declared.at(-1);

  return last === undefined ? { found: false } : { found: true, value: last.value };
};
