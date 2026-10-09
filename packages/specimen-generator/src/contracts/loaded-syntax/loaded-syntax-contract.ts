/**
 * PURPOSE: One syntax or shim declaration after the loader has read it. Reach for this when code
 * needs a declaration's holes, anchors and `code` function together with the syntax nodes they came
 * from. It is types-only because it holds TypeScript nodes and functions that Zod cannot check.
 *
 * USAGE:
 * const loaded: LoadedSyntax = loadedSyntaxFromLoader;
 * loaded.holes.map(({ name }) => name);
 * // Returns the hole names in declaration order
 */
import type ts from '#gateway/npm/typescript';

export interface LoadedSyntax {
  name: string;
  origin: 'shim' | 'syntax';
  description: string;
  kind: 'expression' | 'statement';
  holes: readonly { name: string; type: string; symbol: ts.Symbol }[];
  returnType: string;
  typeParameter?: string;
  allowedTypeArguments: readonly string[];
  anchors: Record<string, unknown>;
  arms: readonly string[];
  form?: { kind: 'call' | 'getter' | 'method'; name: string };
  builtin?: string;
  range?: { min: number; max: number; maxExclusive: boolean; whole: boolean };
  arrow: ts.ArrowFunction;
  sourceFile: ts.SourceFile;
  code: (...holes: readonly unknown[]) => unknown;
}
