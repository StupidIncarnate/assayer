/**
 * PURPOSE: The tree of fills for one specimen. A leaf is a value placed in one hole. A node is a
 * syntax instance whose holes each have their own fill. Reach for this when walking or rendering a
 * planned specimen. It is a recursive union with both members written inline, because a types-only
 * contract file exports one type.
 *
 * USAGE:
 * const tree: FillTree = { kind: 'leaf', owner: 'gt-number', hole: 'value', type: 'number', provenance: 'param', value: 0 };
 * // Returns a FillTree leaf
 */
import type { SyntaxInstance } from '../syntax-instance/syntax-instance-contract';
import type { Provenance } from '../provenance/provenance-contract';

export type FillTree =
  | { kind: 'leaf'; owner: string; hole: string; type: string; provenance: Provenance; value: unknown }
  | { kind: 'node'; instance: SyntaxInstance; holes: Record<string, FillTree> };
