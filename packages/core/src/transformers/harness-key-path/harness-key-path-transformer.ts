/**
 * PURPOSE: Builds the KEY PATH an arrange binding carries for one harness-supplied input — the dotted
 *   route `inputs.<entry>.<param>` into the declaration a colocated harness registered.
 *
 *   It is the write half of a two-ended fact: this spells the route when the case is derived, and
 *   `harness-value` splits it back apart when the case runs. Both read the same statics, so the path a
 *   case names is the path the run can walk — a second spelling of the route would surface as a key
 *   that resolves to nothing at run time, which is the one failure a supplied input must never have.
 *
 * USAGE:
 * harnessKeyPathTransformer({ entry: 'audit', param: 'report' });
 * // Returns 'inputs.audit.report'
 */

import { harnessModuleStatics } from '../../statics/harness-module/harness-module-statics';

export const harnessKeyPathTransformer = ({
  entry,
  param,
}: {
  entry: string;
  param: string;
}): string =>
  [harnessModuleStatics.inputsRoot, String(entry), String(param)].join(harnessModuleStatics.keySeparator);
