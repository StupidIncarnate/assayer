/**
 * PURPOSE: Parses a TypeScript source string with ts-morph and extracts the analysis model for each
 *   EXPORTED function-like entry — `export function` declarations, exported arrow-function and
 *   function-expression `const`s (`export const f = (x) => …` / `export const f = function (x) {…}`),
 *   and default-exported functions/arrows (`export default function f() {…}` / `export default (x) => …`).
 *   For each entry it captures its signature (params + return as serializable type descriptors), its
 *   `if` branch nodes (condition, operand, operand type, parsed predicate), and its exit nodes
 *   (return/throw/implicit-void, plus a concise-body arrow's single implicit `return@top`) with the
 *   ordered guard path reaching each. Literal-union and enum operand types become `union` descriptors
 *   (their members feed exhaustive violating sets); switch/ternary branches are still punted to a later
 *   pass (v1 branch parsing handles `if`).
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

  const declarationEntries = sourceFile
    .getFunctions()
    .filter((fn) => fn.isExported())
    .map((fn) => ({ name: fn.getName() ?? 'default', node: fn }));

  const constEntries = sourceFile
    .getVariableStatements()
    .filter((statement) => statement.isExported())
    .flatMap((statement) => statement.getDeclarations())
    .flatMap((declaration) => {
      const initializer = declaration.getInitializer();
      return initializer !== undefined &&
        (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))
        ? [{ name: declaration.getName(), node: initializer }]
        : [];
    });

  const defaultEntries = sourceFile
    .getExportAssignments()
    .filter((assignment) => !assignment.isExportEquals())
    .flatMap((assignment) => {
      const expression = assignment.getExpression();
      return Node.isArrowFunction(expression) || Node.isFunctionExpression(expression)
        ? [{ name: 'default', node: expression }]
        : [];
    });

  const functions = [...declarationEntries, ...constEntries, ...defaultEntries]
    .filter((entry, index, entries) => entries.findIndex((other) => other.node === entry.node) === index)
    .map(({ name, node: entryNode }) => {
      const scope = name;

      const params = entryNode.getParameters().map((param) => {
        const type = param.getType();
        const literalMembers = type.isUnion()
          ? type
              .getUnionTypes()
              .filter((member) => !member.isUndefined() && !member.isNull())
              .filter(
                (member) => member.isStringLiteral() || member.isNumberLiteral() || member.isEnumLiteral(),
              )
          : [];
        const isLiteralUnion = type.isUnion() && literalMembers.length === type.getUnionTypes().length;
        return {
          name: param.getName(),
          type: type.isString()
            ? { kind: 'string' }
            : type.isNumber()
              ? { kind: 'number' }
              : type.isBoolean()
                ? { kind: 'boolean' }
                : type.isStringLiteral() || type.isNumberLiteral()
                  ? { kind: 'literal', value: type.getLiteralValueOrThrow() }
                  : isLiteralUnion
                    ? {
                        kind: 'union',
                        members: literalMembers.map((member) => ({
                          kind: 'literal',
                          value: member.getLiteralValueOrThrow(),
                        })),
                      }
                    : { kind: 'unknown', text: type.getText() },
        };
      });

      const [returnType] = [entryNode.getReturnType()].map((type) => {
        const literalMembers = type.isUnion()
          ? type
              .getUnionTypes()
              .filter((member) => !member.isUndefined() && !member.isNull())
              .filter(
                (member) => member.isStringLiteral() || member.isNumberLiteral() || member.isEnumLiteral(),
              )
          : [];
        const isLiteralUnion = type.isUnion() && literalMembers.length === type.getUnionTypes().length;
        return type.isString()
          ? { kind: 'string' }
          : type.isNumber()
            ? { kind: 'number' }
            : type.isBoolean()
              ? { kind: 'boolean' }
              : type.isStringLiteral() || type.isNumberLiteral()
                ? { kind: 'literal', value: type.getLiteralValueOrThrow() }
                : isLiteralUnion
                  ? {
                      kind: 'union',
                      members: literalMembers.map((member) => ({
                        kind: 'literal',
                        value: member.getLiteralValueOrThrow(),
                      })),
                    }
                  : { kind: 'unknown', text: type.getText() };
      });

      const body = entryNode.getBody();
      const conciseBody = body !== undefined && !Node.isBlock(body) ? body : undefined;
      const topStatements = body !== undefined && Node.isBlock(body) ? body.getStatements() : [];

      const entryIfStatements = entryNode
        .getDescendantsOfKind(SyntaxKind.IfStatement)
        .filter(
          (ifStmt) =>
            ifStmt.getFirstAncestor(
              (ancestor) =>
                Node.isFunctionDeclaration(ancestor) ||
                Node.isArrowFunction(ancestor) ||
                Node.isFunctionExpression(ancestor),
            ) === entryNode,
        );
      const entryIfSet = new Set<Node>(entryIfStatements);

      const branches = entryIfStatements.map((ifStmt) => {
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
        ...entryNode.getDescendantsOfKind(SyntaxKind.ReturnStatement),
        ...entryNode.getDescendantsOfKind(SyntaxKind.ThrowStatement),
      ]
        .filter(
          (node) =>
            node.getFirstAncestor(
              (ancestor) =>
                Node.isFunctionDeclaration(ancestor) ||
                Node.isArrowFunction(ancestor) ||
                Node.isFunctionExpression(ancestor),
            ) === entryNode,
        )
        .map((node) => {
          const isThrow = Node.isThrowStatement(node);
          const ancestorGuard = node
            .getAncestors()
            .filter((ancestor) => Node.isIfStatement(ancestor) && entryIfSet.has(ancestor))
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
              line:
                body !== undefined && Node.isBlock(body) ? body.getEndLineNumber() : entryNode.getEndLineNumber(),
            },
          ];

      const exits =
        conciseBody === undefined
          ? [...explicitExits, ...implicitExits]
          : [
              {
                coverageId: `${scope}/return@top`,
                kind: 'return',
                guardPath: [],
                line: conciseBody.getStartLineNumber(),
              },
            ];

      return {
        entry: { name: scope, params, returnType, line: entryNode.getStartLineNumber() },
        branches,
        exits,
      };
    });

  return analysisExtractResultContract.parse({ success: true, functions });
};
