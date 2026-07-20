/**
 * PURPOSE: Builds the per-line enrichment for a set of analyzed entries — each param's type on the
 *   entry line, and, once per branch LEAF, that operand's type + representative value range on the
 *   branch line. It reads only an entry's params, its line, and its branches, so both an extracted
 *   function (pre-derivation) and a full function analysis (post-derivation) enrich identically.
 *
 *   A single owner exists because two call sites derive enrichment from the SAME entries: the analyze
 *   broker enriches the composed functions before deriving cases, and the cross-file compose overlay
 *   re-enriches after it swaps a caller's opaque call-guard for the callee's real comparison. Deriving
 *   it in one place is what keeps the overlay's enrichment from lagging its own recomposed branches.
 *
 *   A leaf whose operand is not a simple param has no meaningful symbol/type/range, so it is skipped.
 *   A compound condition enriches once per leaf — `if (score > 5 && bonus > 1)` enriches both operands.
 *
 * USAGE:
 * fileEnrichmentTransformer({ functions: composed });
 * // Returns the enrichment rows: [{ line, symbol, typeText, range? }, …]
 */
import type { BranchNode, EntrySignature, FileAnalysis } from '@assayer/shared/contracts';

import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';
import { domainValuesTransformer } from '../domain-values/domain-values-transformer';
import { typeTextTransformer } from '../type-text/type-text-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';

export const fileEnrichmentTransformer = ({
  functions,
}: {
  functions: { entry: EntrySignature; branches: BranchNode[] }[];
}): FileAnalysis['enrichment'] =>
  functions.flatMap((fn) => [
    ...fn.entry.params.map((param) => ({
      line: fn.entry.line,
      symbol: param.name,
      typeText: typeTextTransformer({ type: param.type }),
    })),
    // Enrichment shows a PARAM's type + representative range on the branch line — once per LEAF, so
    // `if (score > 5 && bonus > 1)` enriches both operands. Reading the branch as a single operand
    // showed neither: a compound condition had no param name to report at all.
    // A leaf whose operand is not a simple param has no meaningful symbol/type/range, so it is
    // skipped.
    ...fn.branches.flatMap((branch) =>
      conditionLeavesTransformer({ condition: branch.condition }).flatMap((leaf) => {
        if (leaf.operandParamName === undefined) {
          return [];
        }
        const armValues = typeToRangeTransformer({
          type: leaf.operandType,
          predicateKind: leaf.predicate.kind,
          ...(leaf.predicate.literal === undefined ? {} : { literal: leaf.predicate.literal }),
        });
        return [
          {
            line: branch.startLine,
            symbol: leaf.operandParamName,
            typeText: typeTextTransformer({ type: leaf.operandType }),
            // Display only, so each arm is realized on its own — this is the range a reader sees
            // beside the line, never a constraint anything derives from.
            range: [
              ...domainValuesTransformer({ domain: armValues.satisfying }),
              ...domainValuesTransformer({ domain: armValues.violating }),
            ],
          },
        ];
      }),
    ),
  ]);
