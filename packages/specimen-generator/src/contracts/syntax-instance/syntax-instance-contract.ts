/**
 * PURPOSE: One loaded syntax bound to one type argument, with the type parameter replaced in its
 * holes, anchors and return type. Reach for this over LoadedSyntax once the matrix has chosen a type
 * argument. It is types-only because it holds TypeScript symbols.
 *
 * USAGE:
 * const instance: SyntaxInstance = instanceFromTransformer;
 * instance.label;
 * // Returns 'gt-number', or the plain name when the syntax is not generic
 */
import type ts from '#gateway/npm/typescript';

import type { LoadedSyntax } from '../loaded-syntax/loaded-syntax-contract';

export interface SyntaxInstance {
  syntax: LoadedSyntax;
  typeArgument?: string;
  label: string;
  holes: readonly { name: string; type: string; symbol: ts.Symbol }[];
  anchors: Record<string, unknown>;
  returnType: string;
}
