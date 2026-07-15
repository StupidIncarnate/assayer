/**
 * PURPOSE: Projects the walk's normalized model into the explorer's type-graph map — the branch
 *   constructs and function declarations rendered per file. It reads the walk's STRUCTURAL layer
 *   (node kinds and spans), not the analysis layer, which is why it can surface a construct the
 *   analyzer cannot yet reason about: a ternary is an unhandled node to the analysis and still a map
 *   node here, so the explorer shows it even while it awaits a handler.
 *
 *   Being a pure function of the same walk as the analysis projection is what collapsed the old
 *   double parse: the map extractor used to build its own `Project` and run its own traversal, which
 *   meant two walks that could silently disagree about the same file.
 *
 * USAGE:
 * mapProjectionTransformer({ walked });
 * // Returns a validated MapExtractResult: { success: true, nodes: [...] }
 */
import { mapExtractResultContract } from '../../contracts/map-extract-result/map-extract-result-contract';
import type { MapExtractResult } from '../../contracts/map-extract-result/map-extract-result-contract';
import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import { mapNodeKindStatics } from '../../statics/map-node-kind/map-node-kind-statics';

export const mapProjectionTransformer = ({ walked }: { walked: WalkFileResult }): MapExtractResult => {
  if (!walked.success) {
    return mapExtractResultContract.parse({ success: false, error: walked.error });
  }

  const nodes = walked.nodes.flatMap((node) => {
    const pair = mapNodeKindStatics.pairs.find((candidate) => candidate.syntaxKind === node.kind);
    if (pair === undefined) {
      return [];
    }
    return [
      {
        kind: pair.mapKind,
        ...(node.name === undefined ? {} : { name: node.name }),
        startLine: node.startLine,
        endLine: node.endLine,
      },
    ];
  });

  return mapExtractResultContract.parse({ success: true, nodes });
};
