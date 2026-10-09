/**
 * PURPOSE: Says which arm a focus syntax reaches when every leaf under it has a known value. It runs
 * the declarations' own `code`, so the answer comes from the configs and never from Assayer. Reach for
 * this when predicting a locked specimen, where known values leave only one arm alive.
 *
 * USAGE:
 * armReachedTransformer({ tree });
 * // Returns 'then' for an `if` whose condition node evaluates to a truthy value
 */
import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import { ArmReachedError } from '../../errors/arm-reached/arm-reached-error';
import { evaluateLayerTransformer } from './evaluate-layer-transformer';

export const armReachedTransformer = ({ tree }: { tree: FillTree }): string => {
  if (tree.kind === 'leaf') {
    throw new Error(
      `The root of the tree is the leaf ${tree.owner}.${tree.hole}, but the root must be the focus syntax. Pass the tree the planner built for the focus.`,
    );
  }

  try {
    evaluateLayerTransformer({ tree, isFocus: true });
  } catch (error) {
    if (error instanceof ArmReachedError) {
      return error.arm;
    }
    throw error;
  }

  throw new Error(
    `The focus '${tree.instance.label}' returned without reaching an arm. Its code must call $arm on every path.`,
  );
};
