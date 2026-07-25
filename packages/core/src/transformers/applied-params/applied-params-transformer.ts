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
 * USAGE:
 * appliedParamsTransformer({ params: [{ name: 'size', type: { kind: 'number' } },
 *   { name: 'report', type: { kind: 'callable', text: '(m: string) => void' }, optional: true }] });
 * // Returns [{ name: 'size', type: { kind: 'number' } }] — the entry is driven as `maybe(11)`
 */
import type { ParamDescriptor } from '@assayer/shared/contracts';

import { fillParamTransformer } from '../fill-param/fill-param-transformer';

export const appliedParamsTransformer = ({ params }: { params: ParamDescriptor[] }): ParamDescriptor[] => {
  const unowed = params.findIndex(
    (param) =>
      (param.optional === true || param.rest === true) && fillParamTransformer({ param }).kind === 'unfillable',
  );

  return unowed === -1 ? params : params.slice(0, unowed);
};
