/**
 * PURPOSE: Builds the source text of one specimen: a container with the focus written into one slot.
 * It keeps only the part of the container that holds the slot, puts the rendered parameters on the
 * slot's callable, puts the rendered declarations at the top of the file, and exports the entry.
 * A file that exports nothing gets `export {};`, so two specimens that declare the same name do not
 * clash as scripts. A statement focus goes in a statement slot as it is. An expression focus goes in a
 * statement slot wrapped in the slot's arm (`return x;`, `console.log(x);` or `yield x;`), and in an
 * expression slot as it is. Reach for this after fillTreeRenderTransformer has rendered the tree.
 *
 * USAGE:
 * specimenAssembleTransformer({ container, slot, rendered, focusKind: 'statement', resultType: 'string', entryName: 'ifFn' });
 * // Returns the specimen's source text, ending in one newline
 */
import ts from '#gateway/npm/typescript';

import type { ContainerSlot } from '../../contracts/container-slot/container-slot-contract';
import type { LoadedContainer } from '../../contracts/loaded-container/loaded-container-contract';
import type { fillTreeRenderTransformer } from '../fill-tree-render/fill-tree-render-transformer';
import { focusStatementsLayerTransformer } from './focus-statements-layer-transformer';
import { parseExpressionLayerTransformer } from './parse-expression-layer-transformer';
import { parseStatementsLayerTransformer } from './parse-statements-layer-transformer';
import { rewriteContainerLayerTransformer } from './rewrite-container-layer-transformer';

export const specimenAssembleTransformer = ({
  container,
  slot,
  rendered,
  focusKind,
  resultType,
  entryName,
}: {
  container: LoadedContainer;
  slot: ContainerSlot;
  rendered: ReturnType<typeof fillTreeRenderTransformer>;
  focusKind: 'expression' | 'statement';
  resultType: string;
  entryName: string;
}): string => {
  if (slot.kind === 'expression' && focusKind === 'statement') {
    throw new Error(
      `The slot '${slot.name}' of the container '${container.name}' is an expression slot, so a statement focus cannot go in it. Plan an expression focus for this slot.`,
    );
  }

  const focusStatements =
    slot.kind === 'statement'
      ? focusStatementsLayerTransformer({ container, slot, text: rendered.text, focusKind })
      : [];
  const focusExpression =
    slot.kind === 'expression' ? parseExpressionLayerTransformer({ text: rendered.text }) : undefined;

  const body = ts.visitNode(
    container.arrow.body,
    (child) =>
      rewriteContainerLayerTransformer({
        node: child,
        container,
        slot,
        params: rendered.params,
        resultType,
        entryName,
        focusStatements,
        focusExpression,
      }),
    ts.isConciseBody,
  );
  if (body === undefined || !ts.isBlock(body)) {
    throw new Error(
      `The container '${container.name}' must write its code as a block, such as code: () => { ... }. Change the arrow function body to a block.`,
    );
  }

  const statements = [
    ...rendered.declarations.flatMap((declaration) => parseStatementsLayerTransformer({ text: declaration.text })),
    ...body.statements,
  ];
  const exportsSomething = statements.some(
    (statement) =>
      ts.isExportAssignment(statement) ||
      (ts.canHaveModifiers(statement) &&
        (ts.getModifiers(statement) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)),
  );
  const printer = ts.createPrinter({ removeComments: true });
  const text = [
    ...statements.map((statement) => printer.printNode(ts.EmitHint.Unspecified, statement, container.sourceFile)),
    ...(exportsSomething ? [] : ['export {};']),
  ].join('\n\n');

  return `${text}\n`;
};
