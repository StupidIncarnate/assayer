/**
 * PURPOSE: Parses a TypeScript source string with ts-morph and extracts the analysis model for each
 *   EXPORTED function-like entry — `export function` declarations, exported arrow-function and
 *   function-expression `const`s (`export const f = (x) => …` / `export const f = function (x) {…}`),
 *   and default-exported functions/arrows (`export default function f() {…}` / `export default (x) => …`).
 *   For each entry it captures its signature (params + return as serializable type descriptors), its
 *   `if` branch nodes plus each `switch` case desugared into an eq-branch (condition, operand, operand
 *   type, parsed predicate), and its exit nodes (return/throw/implicit-void, plus a concise-body
 *   arrow's single implicit `return@top`) with the ordered guard path reaching each — a switch case's
 *   exit guards on its branch's `then` arm, the `default` exit on every case branch's `else` arm.
 *   Literal-union and enum operand types become `union` descriptors (their members feed exhaustive
 *   violating sets, so a switch over such a param yields exhaustive tier-2 cases); ternary branches are
 *   still punted to a later pass.
 *
 * USAGE:
 * tsMorphExtractAnalysisAdapter({ source: 'export function f(n: string) { return n; }', relPath: 'src/f.ts' });
 * // Returns a validated AnalysisExtractResult: { success: true, functions: [...] }
 */
import { Project, Node, SyntaxKind } from 'ts-morph';

import { predicateContract } from '@assayer/shared/contracts';
import type { CoverageId } from '@assayer/shared/contracts';

import { analysisExtractResultContract } from '../../../contracts/analysis-extract-result/analysis-extract-result-contract';
import type { AnalysisExtractResult } from '../../../contracts/analysis-extract-result/analysis-extract-result-contract';
import { coverageIdTransformer } from '../../../transformers/coverage-id/coverage-id-transformer';

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

      const ifBranchData = entryIfStatements.map((ifStmt) => {
        const expr = ifStmt.getExpression();
        // Identity derives ONLY from the STRUCTURAL projection: every node's KIND, plus identifier
        // SYMBOL names, plus literal VALUES (parens dropped). Quote style, operator spacing, reindent,
        // and redundant parens cannot change it (see CLAUDE.md). No source-text field exists.
        const conditionStructure = [expr, ...expr.getDescendants()]
          .filter((child) => !Node.isParenthesizedExpression(child))
          .map((child) =>
            Node.isIdentifier(child)
              ? `id:${child.getText()}`
              : Node.isStringLiteral(child)
                ? `str:${child.getLiteralValue()}`
                : Node.isNumericLiteral(child)
                  ? `num:${String(child.getLiteralValue())}`
                  : child.getKindName(),
          )
          .join(',');

        let operandNode: Node = expr;
        let predicate: unknown = { kind: 'unrecognized' };

        if (Node.isBinaryExpression(expr)) {
          const opKind = expr.getOperatorToken().getKindName();
          const left = expr.getLeft();
          const right = expr.getRight();
          const rightIsZero = Node.isNumericLiteral(right) && right.getLiteralValue() === 0;

          if (Node.isPropertyAccessExpression(left) && left.getName() === 'length') {
            operandNode = left.getExpression();
            predicate =
              opKind === 'EqualsEqualsEqualsToken' && rightIsZero
                ? { kind: 'length-eq-zero' }
                : (opKind === 'GreaterThanToken' || opKind === 'ExclamationEqualsEqualsToken') && rightIsZero
                  ? { kind: 'length-gt-zero' }
                  : { kind: 'unrecognized' };
          } else {
            operandNode = left;
            const literal = Node.isStringLiteral(right)
              ? right.getLiteralValue()
              : Node.isNumericLiteral(right)
                ? right.getLiteralValue()
                : right.getKindName() === 'TrueKeyword'
                  ? true
                  : right.getKindName() === 'FalseKeyword'
                    ? false
                    : undefined;
            const kind =
              opKind === 'EqualsEqualsEqualsToken'
                ? 'eq'
                : opKind === 'ExclamationEqualsEqualsToken'
                  ? 'neq'
                  : opKind === 'GreaterThanToken'
                    ? 'gt'
                    : opKind === 'GreaterThanEqualsToken'
                      ? 'gte'
                      : opKind === 'LessThanToken'
                        ? 'lt'
                        : opKind === 'LessThanEqualsToken'
                          ? 'lte'
                          : 'unrecognized';
            predicate = literal === undefined || kind === 'unrecognized' ? { kind: 'unrecognized' } : { kind, literal };
          }
        }

        // operandName (identifier symbol, for param matching) + predicate feed CASE DERIVATION only.
        // IDENTITY is the whole condition's structural projection — one canonical scheme for every
        // branch (simple or compound), so there is no second "semantic" ID format to drift from.
        const operandName = Node.isIdentifier(operandNode) ? operandNode.getText() : undefined;
        const matched = operandName === undefined ? undefined : params.find((param) => param.name === operandName);
        const parsedPredicate = predicateContract.parse(predicate);

        return {
          node: ifStmt,
          branch: {
            coverageId: coverageIdTransformer({ scope, segment: `if:${conditionStructure}` }),
            kind: 'if',
            ...(operandName === undefined ? {} : { operandParamName: operandName }),
            operandType: matched === undefined ? { kind: 'unknown', text: 'unknown' } : matched.type,
            predicate: parsedPredicate,
            startLine: ifStmt.getStartLineNumber(),
            endLine: ifStmt.getEndLineNumber(),
          },
        };
      });
      const ifCoverageByNode = new Map<Node, CoverageId>(
        ifBranchData.map((data) => [data.node, data.branch.coverageId] as const),
      );
      const ifBranches = ifBranchData.map((data) => data.branch);

      const entrySwitchStatements = entryNode
        .getDescendantsOfKind(SyntaxKind.SwitchStatement)
        .filter(
          (switchStmt) =>
            switchStmt.getFirstAncestor(
              (ancestor) =>
                Node.isFunctionDeclaration(ancestor) ||
                Node.isArrowFunction(ancestor) ||
                Node.isFunctionExpression(ancestor),
            ) === entryNode,
        );
      const entrySwitchClauses = new Set<Node>(
        entrySwitchStatements.flatMap((switchStmt) => switchStmt.getClauses()),
      );

      const switchInfos = entrySwitchStatements.map((switchStmt) => {
        const discNode = switchStmt.getExpression();
        // discStructure = the discriminant's structural projection; discName (identifier symbol) is
        // for param matching only. Every switch case branch keys on the SAME canonical structural
        // scheme as `if` — disc structure + operator kind + typed literal token.
        const discName = Node.isIdentifier(discNode) ? discNode.getText() : undefined;
        const discStructure = [discNode, ...discNode.getDescendants()]
          .filter((child) => !Node.isParenthesizedExpression(child))
          .map((child) =>
            Node.isIdentifier(child)
              ? `id:${child.getText()}`
              : Node.isStringLiteral(child)
                ? `str:${child.getLiteralValue()}`
                : Node.isNumericLiteral(child)
                  ? `num:${String(child.getLiteralValue())}`
                  : child.getKindName(),
          )
          .join(',');
        const matchedParam = discName === undefined ? undefined : params.find((param) => param.name === discName);
        const clauses = switchStmt.getClauses();
        const caseInfos = clauses.flatMap((clause) => {
          if (!Node.isCaseClause(clause)) {
            return [];
          }
          const caseExpr = clause.getExpression();
          if (!Node.isStringLiteral(caseExpr) && !Node.isNumericLiteral(caseExpr)) {
            return [];
          }
          const literalValue = caseExpr.getLiteralValue();
          const literalToken = typeof literalValue === 'string' ? `str:${literalValue}` : `num:${String(literalValue)}`;
          return [
            {
              clause,
              literalValue,
              literalToken,
              branchCoverageId: `${scope}/switch:${discStructure},EqualsEqualsEqualsToken,${literalToken}`,
            },
          ];
        });
        const defaultClause = clauses.find((clause) => Node.isDefaultClause(clause));
        return { discName, matchedParam, caseInfos, defaultClause };
      });

      const switchBranches = switchInfos.flatMap((info) =>
        info.caseInfos.map((caseInfo) => ({
          coverageId: caseInfo.branchCoverageId,
          kind: 'switch',
          ...(info.discName === undefined ? {} : { operandParamName: info.discName }),
          operandType:
            info.matchedParam === undefined ? { kind: 'unknown', text: 'unknown' } : info.matchedParam.type,
          predicate: { kind: 'eq', literal: caseInfo.literalValue },
          startLine: caseInfo.clause.getStartLineNumber(),
          endLine: caseInfo.clause.getEndLineNumber(),
        })),
      );

      const switchExits = switchInfos.flatMap((info) => {
        const defaultGuardPath = info.caseInfos.map((caseInfo) => ({
          branchCoverageId: caseInfo.branchCoverageId,
          arm: 'else',
        }));
        const caseExits = info.caseInfos.flatMap((caseInfo) =>
          [
            ...caseInfo.clause.getDescendantsOfKind(SyntaxKind.ReturnStatement),
            ...caseInfo.clause.getDescendantsOfKind(SyntaxKind.ThrowStatement),
          ].map((node) => {
            const isThrow = Node.isThrowStatement(node);
            return {
              coverageId: `${scope}/${isThrow ? 'throw' : 'return'}@switch:${caseInfo.literalToken}`,
              kind: isThrow ? 'throw' : 'return',
              guardPath: [{ branchCoverageId: caseInfo.branchCoverageId, arm: 'then' }],
              line: node.getStartLineNumber(),
            };
          }),
        );
        const defaultNodes =
          info.defaultClause === undefined
            ? []
            : [
                ...info.defaultClause.getDescendantsOfKind(SyntaxKind.ReturnStatement),
                ...info.defaultClause.getDescendantsOfKind(SyntaxKind.ThrowStatement),
              ];
        const defaultExits = defaultNodes.map((node) => {
          const isThrow = Node.isThrowStatement(node);
          return {
            coverageId: `${scope}/${isThrow ? 'throw' : 'return'}@switch:default`,
            kind: isThrow ? 'throw' : 'return',
            guardPath: defaultGuardPath,
            line: node.getStartLineNumber(),
          };
        });
        return [...caseExits, ...defaultExits];
      });

      const branches = [...ifBranches, ...switchBranches];

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
        .filter((node) => !node.getAncestors().some((ancestor) => entrySwitchClauses.has(ancestor)))
        .map((node) => {
          const isThrow = Node.isThrowStatement(node);
          const ancestorGuard = node
            .getAncestors()
            .filter((ancestor) => Node.isIfStatement(ancestor) && entryIfSet.has(ancestor))
            .flatMap((ancestor) => {
              const branchCoverageId = ifCoverageByNode.get(ancestor);
              if (branchCoverageId === undefined) {
                return [];
              }
              const thenStmt = Node.isIfStatement(ancestor) ? ancestor.getThenStatement() : undefined;
              const inThen =
                thenStmt !== undefined && node.getStart() >= thenStmt.getStart() && node.getEnd() <= thenStmt.getEnd();
              return [{ branchCoverageId, arm: inThen ? 'then' : 'else' }];
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
                  .flatMap((statement) => {
                    const branchCoverageId = ifCoverageByNode.get(statement);
                    return branchCoverageId === undefined ? [] : [{ branchCoverageId, arm: 'else' }];
                  })
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
      const lastSwitchTerminates =
        lastStatement !== undefined &&
        Node.isSwitchStatement(lastStatement) &&
        lastStatement.getClauses().some((clause) => Node.isDefaultClause(clause)) &&
        lastStatement
          .getClauses()
          .every(
            (clause) =>
              clause.getDescendantsOfKind(SyntaxKind.ReturnStatement).length +
                clause.getDescendantsOfKind(SyntaxKind.ThrowStatement).length >
              0,
          );
      const bodyTerminates =
        lastStatement !== undefined &&
        (Node.isReturnStatement(lastStatement) ||
          Node.isThrowStatement(lastStatement) ||
          lastSwitchTerminates);
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
          ? [...explicitExits, ...switchExits, ...implicitExits]
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
