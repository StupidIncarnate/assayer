/**
 * PURPOSE: Works out the value of a fill tree from its known leaves. A leaf is its value. A node is
 * its syntax's `code` called with the values of its holes, in the order the syntax declares them. It
 * refuses a leaf whose value the generator does not know. Reach for this inside armReachedTransformer.
 * A node that is not the focus must return a value, so one that reaches an arm is refused.
 *
 * USAGE:
 * evaluateLayerTransformer({ tree, isFocus: true });
 * // Calls the focus's code, which throws ArmReachedError when it reaches an arm
 */
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import type { LoadedSyntax } from '../../contracts/loaded-syntax/loaded-syntax-contract';
import { ArmReachedError } from '../../errors/arm-reached/arm-reached-error';
import { provenanceStatics } from '../../statics/provenance/provenance-statics';

export const evaluateLayerTransformer = ({
  tree,
  isFocus,
}: {
  tree: FillTree;
  isFocus: boolean;
}): ReturnType<LoadedSyntax['code']> => {
  if (tree.kind === 'leaf') {
    if (provenanceStatics[tree.provenance].test !== 'known') {
      throw new Error(
        `The value of ${tree.owner}.${tree.hole} is not known, because its provenance is '${tree.provenance}'. Only literal and const leaves have a value the generator can evaluate. Give this leaf one of those provenances.`,
      );
    }
    return tree.value;
  }

  const values = tree.instance.holes.map(({ name }) => {
    const child = tree.holes[name];
    if (child === undefined) {
      throw new Error(
        `The node '${tree.instance.label}' has no fill for its hole '${name}'. Give every hole of the node a leaf or a node.`,
      );
    }
    return evaluateLayerTransformer({ tree: child, isFocus: false });
  });

  if (isFocus) {
    return tree.instance.syntax.code(...values);
  }

  try {
    return tree.instance.syntax.code(...values);
  } catch (error) {
    if (error instanceof ArmReachedError) {
      throw new Error(
        `The fill '${tree.instance.label}' reached its '${error.arm}' arm, but only the focus may reach an arm. Use a fill whose code returns a value.`,
        { cause: error },
      );
    }
    throw error;
  }
};
