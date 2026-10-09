/**
 * PURPOSE: One container declaration after the loader has read it: the code that surrounds a
 * generated focus, plus its slots and marker nodes. Reach for this when assembling a specimen. It is
 * types-only because it holds TypeScript nodes.
 *
 * USAGE:
 * const container: LoadedContainer = containerFromTransformer;
 * container.slots.map(({ name }) => name);
 * // Returns the slot names in source order
 */
import type ts from '#gateway/npm/typescript';

import type { ContainerSlot } from '../container-slot/container-slot-contract';

export interface LoadedContainer {
  name: string;
  description: string;
  arrow: ts.ArrowFunction;
  sourceFile: ts.SourceFile;
  slots: readonly ContainerSlot[];
  markers: readonly ts.CallExpression[];
  isClass: boolean;
  exportsDefault: boolean;
}
