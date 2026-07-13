/**
 * PURPOSE: Parses a TypeScript source string with ts-morph and extracts the analysis model for each
 *   EXPORTED function entry: its signature (params + return as serializable type descriptors), its
 *   `if` branch nodes (condition, operand, operand type, parsed predicate), and its exit nodes
 *   (return/throw/implicit-void) with the ordered guard path reaching each. Union operand types and
 *   switch/ternary branches are punted to a later pass (v1 handles `if` + primitive/literal types).
 *
 * USAGE:
 * tsMorphExtractAnalysisAdapter({ source: 'export function f(n: string) { return n; }', relPath: 'src/f.ts' });
 * // Returns a validated AnalysisExtractResult: { success: true, functions: [...] }
 */
import { Project, Node, SyntaxKind } from 'ts-morph';

import { analysisExtractResultContract } from '../../../contracts/analysis-extract-result/analysis-extract-result-contract';
import type { AnalysisExtractResult } from '../../../contracts/analysis-extract-result/analysis-extract-result-contract';

export const tsMorphExtractAnalysisAdapter = ({
  source,
  relPath,
}: {
  source: string;
  relPath: string;
}): AnalysisExtractResult => {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(relPath, source);

  const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
  const [firstDiagnostic] = diagnostics;

  if (firstDiagnostic !== undefined) {
    const start = firstDiagnostic.getStart();
    const position = sourceFile.getLineAndColumnAtPos(start);
    const rawMessage = firstDiagnostic.getMessageText();
    const message = typeof rawMessage === 'string' ? rawMessage : rawMessage.getMessageText();

    return analysisExtractResultContract.parse({
      success: false,
      error: { line: position.line, column: position.column, message },
    });
  }

  const functions = sourceFile
    .getFunctions()
    .filter((fn) => fn.isExported())
    .map((fn) => {
      const scope = fn.getName() ?? 'anonymous';

      const params = fn
        .getParameters()
        .map((param) => ({ name: param.getName(), type: param.getType() }))
        .map((entry) => ({
          name: entry.name,
          type: entry.type.isString()
            ? { kind: 'string' }
            : entry.type.isNumber()
              ? { kind: 'number' }
              : entry.type.isBoolean()
                ? { kind: 'boolean' }
                : entry.type.isStringLiteral() || entry.type.isNumberLiteral()
                  ? { kind: 'literal', value: entry.type.getLiteralValueOrThrow() }
                  : { kind: 'unknown', text: entry.type.getText() },
        }));

      const [returnType] = [fn.getReturnType()].map((type) =>
        type.isString()
          ? { kind: 'string' }
          : type.isNumber()
            ? { kind: 'number' }
            : type.isBoolean()
              ? { kind: 'boolean' }
              : type.isStringLiteral() || type.isNumberLiteral()
                ? { kind: 'literal', value: type.getLiteralValueOrThrow() }
                : { kind: 'unknown', text: type.getText() },
      );

      const body = fn.getBody();
      const topStatements = body !== undefined && Node.isBlock(body) ? body.getStatements() : [];

      const branches = fn
        .getDescendantsOfKind(SyntaxKind.IfStatement)
        .filter((ifStmt) => ifStmt.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) === fn)
        .map((ifStmt) => {
          const expr = ifStmt.getExpression();
          const conditionText = expr.getText();
          let operandText = conditionText;
          let predicate: unknown = { kind: 'unrecognized' };

          if (Node.isBinaryExpression(expr)) {
            const op = expr.getOperatorToken().getText();
            const left = expr.getLeft();
            const right = expr.getRight();
            const rightText = right.getText();

            if (Node.isPropertyAccessExpression(left) && left.getName() === 'length') {
              operandText = left.getExpression().getText();
              predicate =
                op === '===' && rightText === '0'
                  ? { kind: 'length-eq-zero' }
                  : (op === '>' || op === '!==') && rightText === '0'
                    ? { kind: 'length-gt-zero' }
                    : { kind: 'unrecognized' };
            } else {
              operandText = left.getText();
              const literal = Node.isStringLiteral(right)
                ? right.getLiteralValue()
                : Node.isNumericLiteral(right)
                  ? Number(rightText)
                  : rightText === 'true'
                    ? true
                    : rightText === 'false'
                      ? false
                      : undefined;
              const kind =
                op === '==='
                  ? 'eq'
                  : op === '!=='
                    ? 'neq'
                    : op === '>'
                      ? 'gt'
                      : op === '>='
                        ? 'gte'
                        : op === '<'
                          ? 'lt'
                          : op === '<='
                            ? 'lte'
                            : 'unrecognized';
              predicate = literal === undefined || kind === 'unrecognized' ? { kind: 'unrecognized' } : { kind, literal };
            }
          }

          const matched = params.find((param) => param.name === operandText);

          return {
            coverageId: `${scope}/if:${conditionText}`,
            kind: 'if',
            conditionText,
            operandParamName: operandText,
            operandType: matched === undefined ? { kind: 'unknown', text: 'unknown' } : matched.type,
            predicate,
            startLine: ifStmt.getStartLineNumber(),
            endLine: ifStmt.getEndLineNumber(),
          };
        });

      const explicitExits = [
        ...fn.getDescendantsOfKind(SyntaxKind.ReturnStatement),
        ...fn.getDescendantsOfKind(SyntaxKind.ThrowStatement),
      ]
        .filter((node) => node.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) === fn)
        .map((node) => {
          const isThrow = Node.isThrowStatement(node);
          const ancestorGuard = node
            .getAncestors()
            .filter(
              (ancestor) =>
                Node.isIfStatement(ancestor) && ancestor.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) === fn,
            )
            .map((ancestor) => {
              const thenStmt = Node.isIfStatement(ancestor) ? ancestor.getThenStatement() : undefined;
              const inThen =
                thenStmt !== undefined && node.getStart() >= thenStmt.getStart() && node.getEnd() <= thenStmt.getEnd();
              const conditionText = Node.isIfStatement(ancestor) ? ancestor.getExpression().getText() : '';
              return { branchCoverageId: `${scope}/if:${conditionText}`, arm: inThen ? 'then' : 'else' };
            })
            .reverse();

          const topIndex = topStatements.indexOf(node);
          const negationGuard =
            ancestorGuard.length === 0 && topIndex >= 0
              ? topStatements
                  .slice(0, topIndex)
                  .filter(
                    (statement) =>
                      Node.isIfStatement(statement) &&
                      statement.getElseStatement() === undefined &&
                      statement.getThenStatement().getDescendantsOfKind(SyntaxKind.ReturnStatement).length +
                        statement.getThenStatement().getDescendantsOfKind(SyntaxKind.ThrowStatement).length >
                        0,
                  )
                  .map((statement) => ({
                    branchCoverageId: `${scope}/if:${Node.isIfStatement(statement) ? statement.getExpression().getText() : ''}`,
                    arm: 'else',
                  }))
              : [];

          const guardPath = ancestorGuard.length > 0 ? ancestorGuard : negationGuard;
          const armSegment = guardPath.length > 0 ? guardPath.map((step) => `if-${step.arm}`).join('/') : 'top';

          return {
            coverageId: `${scope}/${isThrow ? 'throw' : 'return'}@${armSegment}`,
            kind: isThrow ? 'throw' : 'return',
            guardPath,
            line: node.getStartLineNumber(),
          };
        });

      const lastStatement = topStatements.at(-1);
      const bodyTerminates =
        lastStatement !== undefined && (Node.isReturnStatement(lastStatement) || Node.isThrowStatement(lastStatement));
      const implicitExits = bodyTerminates
        ? []
        : [
            {
              coverageId: `${scope}/exit@implicit`,
              kind: 'implicit',
              guardPath: [],
              line: body !== undefined && Node.isBlock(body) ? body.getEndLineNumber() : fn.getEndLineNumber(),
            },
          ];

      return {
        entry: { name: scope, params, returnType, line: fn.getStartLineNumber() },
        branches,
        exits: [...explicitExits, ...implicitExits],
      };
    });

  return analysisExtractResultContract.parse({ success: true, functions });
};
