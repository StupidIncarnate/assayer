/**
 * PURPOSE: Turns the parameters the fill seam REFUSED for one entry into its EntryGap admission — the
 *   product-surface invoice (P1) for an input Assayer understood perfectly and cannot construct.
 *
 *   A gap, never one of the other three channels, because the four differ by WHO OWES the work. Assayer
 *   read the signature and knows exactly which parameter it cannot build, so this is neither a dark spot
 *   (syntax it never parsed) nor an undriven entry (understood, and out of the runner's reach whatever
 *   anyone supplies) nor a lint (a pattern the repo should change — the code here is ordinary and
 *   correct). It is the CALLER's debt, and the caller closes it by supplying the value.
 *
 *   `reason` names the entry, every refused parameter with the type the checker renders for it, WHY no
 *   value of that type can be derived, and the harness that satisfies the check — spelled out as code so
 *   an LLM can act on it with no human in the loop. One gap per ENTRY rather than per parameter: the gap
 *   is keyed by entry name, one harness declaration closes every refused input at once, and two rows
 *   naming one entry would read as two debts.
 *
 *   A refusal may name a parameter the entry does not itself declare. A surface whose only exit returns
 *   a private, or whose array param a callback iterates, is the ONLY entry the file offers — the private
 *   and the callback fold into it — so a parameter THEY declare is still what stops the surface deriving
 *   a case. `owner` names that scope, the refusal reads `on \`helper\``, and the harness snippet keys the
 *   input under the scope that declares it. Without it the invoice would bill the surface for a
 *   parameter its signature does not have, which is a reader hunting for a `cb` that is not there.
 *
 *   The closing sentence promises only what supplying the value actually does. It does NOT promise cases:
 *   an entry can be blocked twice over — a method whose class also needs constructor arguments lands in
 *   the ACCESS gap the moment its inputs are buildable, and a branch on an opaque value is admitted
 *   UNDRIVEN once this gap stops suppressing it. Each of those states itself on its own line, so the
 *   promise is that the refusal ends, not that a test appears.
 *
 *   `hasCases` says whether the SAME entry also derived at least one real case despite the refusal — a
 *   truthy arm an object's own shape builds fine while its falsy arm needs a value nothing can build, or
 *   any other bucket that never touches the refused parameter. "Derives no case" is a lie the moment one
 *   exists, so the opening clause reads "derives a case, but not every one it could" instead; every other
 *   sentence — which parameters, why, and the harness that closes it — stays the same, because the debt
 *   is identical either way.
 *
 * USAGE:
 * inputGapTransformer({ entryName: 'audit', unfillable: [{ param: 'report', type: '(m: string) => string' }] });
 * // Returns [{ name: 'audit', reason: '`audit` derives no case, because Assayer cannot construct…' }]
 */
import { entryGapContract } from '@assayer/shared/contracts';
import type { EntryGap } from '@assayer/shared/contracts';

export const inputGapTransformer = ({
  entryName,
  unfillable,
  hasCases = false,
}: {
  entryName: string;
  unfillable: readonly { param: string; type: string; owner?: string | undefined }[];
  // Whether the entry ALSO derived at least one real case alongside this refusal. Optional so a caller
  // that has not threaded the fact through yet falls back to the prior "derives no case" wording — true
  // for every producer that has, false or absent for one that has not caught up.
  hasCases?: boolean;
}): EntryGap[] => {
  if (unfillable.length === 0) {
    return [];
  }

  // Every refusal resolved to the scope that DECLARES it — the entry itself unless a folded private or
  // callback owns the parameter — then de-duplicated on (scope, parameter) in first-seen order, so one
  // parameter refused by several buckets or by both the entry and its funnel is invoiced once.
  const owned = unfillable.map((entry) => ({
    param: entry.param,
    type: entry.type,
    ownerName: entry.owner === undefined ? entryName : entry.owner,
  }));
  const distinct = [...new Map(owned.map((entry) => [`${entry.ownerName}.${entry.param}`, entry])).values()];

  // Both lists are built from the same refusals in the same order, so the sentence and the harness
  // snippet always name the same parameters — the reader never has to reconcile two lists.
  const refused = distinct
    .map(
      (entry) =>
        `\`${entry.param}: ${entry.type}\`${ 
        entry.ownerName === entryName ? '' : ` on \`${entry.ownerName}\``}`,
    )
    .join(', ');
  // Grouped by declaring scope, because that is how the harness is keyed: an input belongs to the
  // signature that names it, not to the entry the runner happens to call.
  const inputs = [...new Set(distinct.map((entry) => entry.ownerName))]
    .map(
      (ownerName) =>
        `${ownerName}: { ${distinct
          .filter((entry) => entry.ownerName === ownerName)
          .map((entry) => `${entry.param}: <a ${entry.type}>`)
          .join(', ')} }`,
    )
    .join(', ');

  return [
    entryGapContract.parse({
      name: entryName,
      reason:
        `${hasCases
          ? `\`${entryName}\` derives a case, but not every one it could: Assayer cannot ` +
            'construct an input it still needs. '
          : `\`${entryName}\` derives no case, because Assayer cannot construct an input it needs. ` 
        }It builds inputs out of declared DATA — a scalar, a union, an array, or an object shape whose ` +
        `every property is itself one — and refuses anything that bottoms out in a function or in a type ` +
        `carrying nothing but its name: ${refused}. Substituting a stand-in would be worse than deriving ` +
        `nothing: code that CALLS the value throws on it, and code that merely measures it passes on ` +
        `something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed — ` +
        `so the value is the caller's to supply. Colocate a harness with this file, the same basename ` +
        `with a \`.harness.ts\` extension, and declare the input: \`import { assayerHarness } from ` +
        `'@assayer/core'; assayerHarness({ inputs: { ${inputs} } });\`. ` +
        `Assayer then builds them from that declaration instead of refusing them; anything else still ` +
        `standing between \`${entryName}\` and a case is reported on its own line.`,
    }),
  ];
};
