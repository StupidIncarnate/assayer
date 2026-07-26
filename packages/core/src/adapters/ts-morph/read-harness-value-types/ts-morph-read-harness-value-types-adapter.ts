/**
 * PURPOSE: Reads the STATIC type of every value a harness supplies — one `{ entry, param, type }` per
 *   `inputs.<entry>.<param>` an `assayerHarness({ ... })` call declares — off the harness's own PARSED
 *   AST, never the runtime value the sandbox produces. A runtime value cannot answer the question this
 *   exists for: after the sandbox runs, every callback is `[Function]`, and an empty `[]` is a
 *   `string[]` and a `number[]` alike, so only the declaration's checker-inferred type says what a
 *   supplied expression actually IS.
 *
 *   Parses with a fresh, hermetic ts-morph project (`useInMemoryFileSystem: true`, no `node_modules`) —
 *   the harness's own boundary read, kept separate from the target file's walk and from the eval-based
 *   `typescript/load-harness` adapter, which answers a different question (what did the sandbox collect)
 *   with a different tool (the plain `typescript` compiler, transpile-only, no checker). Reading types
 *   needs the CHECKER, which only a `ts-morph`/`typescript` PROGRAM carries.
 *
 *   Every `assayerHarness(...)` call in the file contributes — several calls in one harness fold into one
 *   list, matching how `harness-keys` folds several calls' declared keys into one inventory. A key
 *   declared twice keeps its LAST occurrence, mirroring `Object.assign`/spread semantics for the object
 *   literal a second call's key would have overwritten at runtime.
 *
 *   Only PLAIN keys are read: a property assignment (`report: cb`), a shorthand (`{ report }`), or a
 *   method shorthand (`{ report(m) {...} }`). A computed key (`[dynamic]: cb`) or a spread
 *   (`{ ...rest }`) names no static (entry, param) pair to attach a type to, so it contributes nothing —
 *   the same silent skip `harness-keys` gives a shape it cannot enumerate.
 *
 * USAGE:
 * tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/audit.harness.ts' });
 * // Returns [{ entry: 'audit', param: 'report', type: { kind: 'unknown', text: 'undefined' } }]
 */
import { Node, Project, SyntaxKind } from 'ts-morph';

import { symbolNameContract } from '@assayer/shared/contracts';
import type { SymbolName, TypeDescriptor } from '@assayer/shared/contracts';

import { typeDescriptorTransformer } from '../../../transformers/type-descriptor/type-descriptor-transformer';
import { harnessModuleStatics } from '../../../statics/harness-module/harness-module-statics';
import { readHarnessValueTypeLayerAdapter } from './read-harness-value-type-layer-adapter';

export const tsMorphReadHarnessValueTypesAdapter = ({
  source,
  fileName,
}: {
  source: string;
  fileName: string;
}): { entry: SymbolName; param: SymbolName; type: TypeDescriptor }[] => {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(fileName, source);

  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
    const callee = call.getExpression();

    // Both ordinary spellings of the one import count, the same conjunction the symbol gate reads: a
    // direct call (`assayerHarness(...)`, renamed or not — the LOCAL name is what a call site can ever
    // spell) or a namespace member call (`core.assayerHarness(...)`).
    return (
      (Node.isIdentifier(callee) && callee.getText() === harnessModuleStatics.registrar) ||
      (Node.isPropertyAccessExpression(callee) && callee.getName() === harnessModuleStatics.registrar)
    );
  });

  const found: { entry: SymbolName; param: SymbolName; type: TypeDescriptor }[] = [];

  calls.forEach((call) => {
    const [arg] = call.getArguments();

    if (arg === undefined || !Node.isObjectLiteralExpression(arg)) {
      return;
    }

    const inputsProp = arg.getProperty(harnessModuleStatics.inputsRoot);

    if (inputsProp === undefined || !Node.isPropertyAssignment(inputsProp)) {
      return;
    }

    const inputsValue = inputsProp.getInitializer();

    if (inputsValue === undefined || !Node.isObjectLiteralExpression(inputsValue)) {
      return;
    }

    inputsValue.getProperties().forEach((entryProp) => {
      if (!Node.isPropertyAssignment(entryProp)) {
        return;
      }

      const entryValue = entryProp.getInitializer();

      if (entryValue === undefined || !Node.isObjectLiteralExpression(entryValue)) {
        return;
      }

      const entry = symbolNameContract.parse(entryProp.getName());

      entryValue.getProperties().forEach((paramProp) => {
        // A plain value (`report: cb`) reads its initializer's type. A computed key or a spread names no
        // static (entry, param) pair, so it is silently skipped — the same shape `harness-keys` cannot
        // enumerate either.
        if (Node.isPropertyAssignment(paramProp)) {
          const initializer = paramProp.getInitializer();

          if (initializer === undefined) {
            return;
          }

          const param = symbolNameContract.parse(paramProp.getName());
          const type = typeDescriptorTransformer({ fact: readHarnessValueTypeLayerAdapter({ type: initializer.getType() }) });

          found.push({ entry, param, type });
          return;
        }

        // A shorthand (`{ report }`) and a method shorthand (`{ report(m) {...} }`) read the property
        // node's own type directly — ts-morph types either kind of node through the same checker.
        if (Node.isShorthandPropertyAssignment(paramProp) || Node.isMethodDeclaration(paramProp)) {
          const param = symbolNameContract.parse(paramProp.getName());
          const type = typeDescriptorTransformer({ fact: readHarnessValueTypeLayerAdapter({ type: paramProp.getType() }) });

          found.push({ entry, param, type });
        }
      });
    });
  });

  return found;
};
