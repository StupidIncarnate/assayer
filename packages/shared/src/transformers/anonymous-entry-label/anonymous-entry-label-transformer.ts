/**
 * PURPOSE: Renders the human LABEL for an anonymous function entry — the callsite that reaches it,
 *   which is the only handle a scope with no name has. `rescale › items.map((n) => …) L2` says who
 *   holds it, how it is reached, what it takes, and where to look.
 *
 *   The alternative is what an unlabelled entry shows: `name` is a coverage-ID segment, and an
 *   anonymous function's is its whole STRUCTURAL PROJECTION (`fn:ArrowFunction,Parameter,id:n,…`).
 *   That string is correct as identity and unreadable as a label, and it is cache-internal by ruling —
 *   printing it puts a key on the product surface.
 *
 *   The LINE is part of the label, not decoration beside it. Two identical arrows in one file project
 *   to the same reach and the same params, so without it a surface would show one label twice and the
 *   reader could not tell which row belonged to which. It is display-only, which is exactly why it may
 *   be positional where the NAME may not: an id must not move when code moves, a label must.
 *
 *   The host is omitted for a scope the module itself holds, rather than printed as the internal
 *   `*module*`. The file is the host there, and every surface already names the file above the entry.
 *
 * USAGE:
 * anonymousEntryLabelTransformer({ host: 'rescale', reach: { kind: 'argument', receiver: 'items', method: 'map' }, params: [{ name: 'n', … }], line: 2 });
 * // Returns 'rescale › items.map((n) => …) L2'
 */
import { entryLabelContract } from '../../contracts/entry-label/entry-label-contract';
import type { EntryLabel } from '../../contracts/entry-label/entry-label-contract';
import type { AnonymousReach } from '../../contracts/anonymous-reach/anonymous-reach-contract';
import type { LineNumber } from '../../contracts/line-number/line-number-contract';
import type { ParamDescriptor } from '../../contracts/param-descriptor/param-descriptor-contract';

export const anonymousEntryLabelTransformer = ({
  host,
  reach,
  params,
  line,
}: {
  host?: string;
  reach: AnonymousReach;
  params: readonly ParamDescriptor[];
  line: LineNumber;
}): EntryLabel => {
  // The arrow as the reader wrote it, minus its body: the signature is what distinguishes two
  // callbacks at a glance, and the body is on screen beside the label anyway.
  const arrow = `(${params.map((param) => String(param.name)).join(', ')}) => …`;
  const prefix = host === undefined ? '' : `${String(host)} › `;
  const suffix = ` L${String(line)}`;

  if (reach.kind === 'return') {
    return entryLabelContract.parse(`${prefix}return ${arrow}${suffix}`);
  }

  if (reach.kind === 'invocation') {
    return entryLabelContract.parse(`${prefix}(${arrow})(…)${suffix}`);
  }

  // A `receiver.method(…)` shape names both; a bare call names its callee; a computed or chained
  // callee names neither, so the label says only that the arrow was passed somewhere.
  const called =
    reach.receiver !== undefined && reach.method !== undefined
      ? `${String(reach.receiver)}.${String(reach.method)}`
      : reach.callee;

  return entryLabelContract.parse(called === undefined ? `${prefix}${arrow}${suffix}` : `${prefix}${called}(${arrow})${suffix}`);
};
