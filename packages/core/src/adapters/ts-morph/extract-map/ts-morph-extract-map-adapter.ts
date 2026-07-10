/**
 * PURPOSE: Parses a TypeScript source string with ts-morph and extracts the type-graph map
 *   nodes (functions, if statements, switch statements, ternaries) it contains, or a positioned
 *   syntax error explaining why extraction failed.
 *
 * USAGE:
 * tsMorphExtractMapAdapter({ source: 'function foo() { return 1; }' });
 * // Returns a validated MapExtractResult: { success: true, nodes: [...] }
 */
import { Project, Node } from 'ts-morph';

import { mapNodeContract } from '@assayer/shared/contracts';
import type { MapNode } from '@assayer/shared/contracts';

import { mapExtractResultContract } from '../../../contracts/map-extract-result/map-extract-result-contract';
import type { MapExtractResult } from '../../../contracts/map-extract-result/map-extract-result-contract';

export const tsMorphExtractMapAdapter = ({ source }: { source: string }): MapExtractResult => {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('temp.ts', source);

  const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
  const [firstDiagnostic] = diagnostics;

  if (firstDiagnostic !== undefined) {
    const start = firstDiagnostic.getStart();
    const position = sourceFile.getLineAndColumnAtPos(start);
    const rawMessage = firstDiagnostic.getMessageText();
    const message = typeof rawMessage === 'string' ? rawMessage : rawMessage.getMessageText();

    return mapExtractResultContract.parse({
      success: false,
      error: { line: position.line, column: position.column, message },
    });
  }

  const nodes: MapNode[] = [];

  sourceFile.forEachDescendant((node) => {
    if (Node.isFunctionDeclaration(node)) {
      const name = node.getName();
      nodes.push(
        mapNodeContract.parse({
          kind: 'function',
          ...(name === undefined ? {} : { name }),
          startLine: node.getStartLineNumber(),
          endLine: node.getEndLineNumber(),
        }),
      );
    } else if (Node.isIfStatement(node)) {
      nodes.push(
        mapNodeContract.parse({
          kind: 'if',
          startLine: node.getStartLineNumber(),
          endLine: node.getEndLineNumber(),
        }),
      );
    } else if (Node.isConditionalExpression(node)) {
      nodes.push(
        mapNodeContract.parse({
          kind: 'ternary',
          startLine: node.getStartLineNumber(),
          endLine: node.getEndLineNumber(),
        }),
      );
    } else if (Node.isSwitchStatement(node)) {
      nodes.push(
        mapNodeContract.parse({
          kind: 'switch',
          startLine: node.getStartLineNumber(),
          endLine: node.getEndLineNumber(),
        }),
      );
    }
  });

  return mapExtractResultContract.parse({ success: true, nodes });
};
