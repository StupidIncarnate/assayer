/**
 * PURPOSE: One place in a container where generated code goes. Reach for this when planning where a
 * focus syntax is written and what surrounds it. It is types-only because it holds TypeScript nodes.
 *
 * USAGE:
 * const slot: ContainerSlot = slotFromTransformer;
 * slot.hasParams;
 * // Returns true when the callable around the marker takes the generated parameters
 */
import type ts from '#gateway/npm/typescript';

export interface ContainerSlot {
  name: string;
  kind: 'expression' | 'statement';
  reach: string;
  arm?: 'log' | 'return' | 'yield';
  marker: ts.CallExpression;
  callable?: ts.SignatureDeclaration;
  hasParams: boolean;
}
