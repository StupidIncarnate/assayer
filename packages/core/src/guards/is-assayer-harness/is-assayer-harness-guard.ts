/**
 * PURPOSE: The SYMBOL GATE — answers whether one source file is an Assayer harness, by parsing it with
 *   the npm `typescript` compiler API and asking two structural questions: does it import
 *   `assayerHarness` from `@assayer/core`, and does its module body CALL what that import bound.
 *
 *   The filename alone cannot answer it. `*.harness.ts` is a widely used name — this repo's own
 *   Playwright and Jest harnesses wear it — and loading one of those would boot Electron or a nested
 *   runner, while erroring on one would fail a build over a file that was never addressed to Assayer.
 *   So the suffix says WHICH source file a harness applies to and the imported symbol decides WHETHER
 *   it is one at all; a file that fails this gate is ordinary source, silently.
 *
 *   Both the named form (`import { assayerHarness }`, renamed or not) and the namespace form
 *   (`import * as core` then `core.assayerHarness(…)`) count, because both are ordinary spellings of one
 *   import and neither is more of a registration than the other. The call is read off the module BODY,
 *   which is the shape the artifact has: a harness exports nothing and registers by being run.
 *
 *   Read from the parsed AST — import clause elements and a call expression's callee — never from the
 *   file's text, so a reformatted or renamed-on-import harness classifies identically.
 *
 * USAGE:
 * typescriptHarnessGateAdapter({ source: "import { assayerHarness } from '@assayer/core';\nassayerHarness({ inputs: {} });" });
 * // Returns true — imported and called, so this file is Assayer's
 */
import ts from '#gateway/npm/typescript';

import { symbolNameContract } from '@assayer/shared/contracts';

import { harnessModuleStatics } from '../../statics/harness-module/harness-module-statics';

export const isAssayerHarnessGuard = ({ source }: { source: string }): boolean => {
  const sourceFile = ts.createSourceFile('harness.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const coreBindings = sourceFile.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      return [];
    }

    const specifier = statement.moduleSpecifier.text;
    const bindings = statement.importClause?.namedBindings;

    if (
      bindings === undefined ||
      (specifier !== harnessModuleStatics.packageName &&
        !specifier.startsWith(`${harnessModuleStatics.packageName}/`))
    ) {
      return [];
    }

    return [bindings];
  });

  const directNames = new Set(
    coreBindings.flatMap((bindings) =>
      ts.isNamedImports(bindings)
        ? bindings.elements
            .filter((element) => (element.propertyName?.text ?? element.name.text) === harnessModuleStatics.registrar)
            .map((element) => symbolNameContract.parse(element.name.text))
        : [],
    ),
  );

  const namespaceNames = new Set(
    coreBindings.flatMap((bindings) =>
      ts.isNamespaceImport(bindings) ? [symbolNameContract.parse(bindings.name.text)] : [],
    ),
  );

  return sourceFile.statements.some((statement) => {
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) {
      return false;
    }

    const callee = statement.expression.expression;

    if (ts.isIdentifier(callee)) {
      return directNames.has(symbolNameContract.parse(callee.text));
    }

    return (
      ts.isPropertyAccessExpression(callee) &&
      ts.isIdentifier(callee.expression) &&
      callee.name.text === harnessModuleStatics.registrar &&
      namespaceNames.has(symbolNameContract.parse(callee.expression.text))
    );
  });
};
