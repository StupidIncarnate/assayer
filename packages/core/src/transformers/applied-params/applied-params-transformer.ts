/**
 * PURPOSE: Narrows an entry's declared parameters to the ones a CALL must supply — the list every
 *   arrange is laid out over. A parameter the caller owes nothing (`optional`, a default, or `rest`)
 *   and the fill seam cannot construct is not owed: `maybe(size: number, report?: (m: string) => void)`
 *   is called as `maybe(11)`, so refusing to derive a case for it invoices a debt nobody has.
 *
 *   It TRUNCATES rather than filters, because the interpreter applies an arrange POSITIONALLY. Dropping
 *   a parameter out of the middle would slide every later argument one slot left and hand the entry
 *   values under the wrong names — so once a parameter is not supplied, nothing after it can be either.
 *   TypeScript already forbids a required parameter after an optional one and puts the rest parameter
 *   last, so the truncated tail is only ever other omissible parameters.
 *
 *   A REQUIRED parameter the seam refuses is left in place: it is a real debt, the entry cannot be
 *   called without it, and `fill-param` reports the refusal that `input-gap` invoices.
 *
 *   `harness` names the parameters a colocated harness ANSWERS for this entry — the same names
 *   `cause-arrange` accepts to bind them instead of filling them. A trailing optional/rest parameter the
 *   seam refuses is still not owed BY THE SEAM, but a harness that names it has already answered the
 *   refusal, so truncating past it would throw the payment away before `cause-arrange` ever sees it:
 *   the harness key would validate (`harness-validate` checks it against the entry's full declared
 *   params, never this truncated list) and then bind nothing, because the parameter it names is no
 *   longer in `applied` for anything downstream to attach a binding to. Naming it here is what keeps it
 *   in the list truncation would otherwise drop.
 *
 * USAGE:
 * appliedParamsTransformer({ params: [{ name: 'size', type: { kind: 'number' } },
 *   { name: 'report', type: { kind: 'callable', text: '(m: string) => void' }, optional: true }] });
 * // Returns [{ name: 'size', type: { kind: 'number' } }] — the entry is driven as `maybe(11)`
 * appliedParamsTransformer({ params: [...], harness: ['report'] });
 * // A harness-answered trailing parameter is kept even though the seam alone would refuse it
 */
import type { ParamDescriptor } from '@assayer/shared/contracts';

import { fillParamTransformer } from '../fill-param/fill-param-transformer';

export const appliedParamsTransformer = ({
  params,
  harness,
}: {
  params: ParamDescriptor[];
  harness?: readonly string[] | undefined;
}): ParamDescriptor[] => {
  const harnessNames = new Set((harness ?? []).map((name) => name));
  const unowed = params.findIndex(
    (param) =>
      (param.optional === true || param.rest === true) &&
      !harnessNames.has(String(param.name)) &&
      fillParamTransformer({ param }).kind === 'unfillable',
  );

  return unowed === -1 ? params : params.slice(0, unowed);
};
