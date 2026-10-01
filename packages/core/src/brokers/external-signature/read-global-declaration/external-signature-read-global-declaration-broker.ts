/**
 * PURPOSE: Reads the declared type of an AMBIENT-EXTERNAL reference — an ambient global the hermetic
 *   walk could not type (`console.log`, `process.env`, `setTimeout`) or a node builtin import, whether
 *   CALLED (`import { join } from 'node:path'; join(a, b)`) or bound as a VALUE (`const sep = sep`) —
 *   out of the SECOND, node_modules-aware project (§5.10), kept
 *   strictly separate from the hermetic walk. It resolves each by writing a tiny PROBE source that
 *   references the name and asking the checker for its type: a builtin's ambient `declare module` and a
 *   global's ambient declaration both resolve here, where the hermetic project has neither. (The
 *   ambient-module form is why a builtin cannot be read from a `.d.ts` path like a package: node's
 *   modules resolve only through the checker, not `ts.resolveModuleName`.)
 *
 *   A CALLED reference (`called: true`) yields its first call signature's `{ params, returnType }` —
 *   the same `ExternalSignature` a package callable carries, fed through the same
 *   `typeDescriptorTransformer`, so no new type language. A reference that is NOT called — a global
 *   member access (`process.env`) or a builtin bound as a value (`sep`) — yields the referenced
 *   binding's `TypeDescriptor`. When `@types/node` cannot type it — the root name resolves to nothing,
 *   or a called
 *   reference names no callable — it ships no usable types. `declPath` is the resolving `.d.ts`, for the
 *   cache key. ONE reusable project per tsconfig, exactly like the external-signature reader.
 *
 * USAGE:
 * externalSignatureReadGlobalDeclarationBroker({ tsConfigFilePath, reference: { kind: 'global', name: 'console', member: 'log', called: true } });
 * // Returns { usable: true, result: 'signature', signature, declPath } | { usable: true, result: 'type', type, declPath } | { usable: false }
 */
import { dirname, join as joinPath } from '#gateway/node/path';

import { Node, Project } from '#gateway/npm/ts-morph';

import { externalSignatureContract, paramDescriptorContract } from '@assayer/shared/contracts';
import type { ExternalSignature, TypeDescriptor } from '@assayer/shared/contracts';

import { typeDescriptorTransformer } from '../../../transformers/type-descriptor/type-descriptor-transformer';
import { readGlobalTypeLayerBroker } from './read-global-type-layer-broker';

type GlobalReference =
  | { kind: 'global'; name: string; member?: string; called: boolean }
  | { kind: 'builtin'; specifier: string; importedName: string; called: boolean };

// `declText` is the FULL TEXT of the `.d.ts` the type was declared in — carried out of ts-morph (which
// holds it in memory even for the standard `lib.*.d.ts`, whose on-disk path is a virtual one no fs read
// can open), so the cache can key on the resolving declaration's bytes without touching the filesystem.
type GlobalSignatureResult =
  | { usable: true; result: 'signature'; signature: ExternalSignature; declText: string }
  | { usable: true; result: 'type'; type: TypeDescriptor; declText: string }
  | { usable: false };

const globalProjectByConfig = new Map<string, Project>();
const PROBE_PATH = '__assayer_global_probe__.ts';

export const externalSignatureReadGlobalDeclarationBroker = ({
  tsConfigFilePath,
  reference,
}: {
  tsConfigFilePath: string;
  reference: GlobalReference;
}): GlobalSignatureResult => {
  const existing = globalProjectByConfig.get(tsConfigFilePath);
  const project = existing ?? new Project({ tsConfigFilePath: tsConfigFilePath, skipAddingFilesFromTsConfig: true });
  if (existing === undefined) {
    globalProjectByConfig.set(tsConfigFilePath, project);
  }

  // A builtin references its imported binding; a global its member access (or the bare name). Both
  // reduce to reading the type of the LAST statement's expression in a throwaway probe source.
  const probeSource =
    reference.kind === 'builtin'
      ? `import { ${reference.importedName} } from '${reference.specifier}';\n${reference.importedName};\n`
      : reference.member === undefined
        ? `${reference.name};\n`
        : `${reference.name}.${reference.member};\n`;

  const {called} = reference;

  // The probe sits next to the tsconfig so the project's `@types` resolution (rooted at the tsconfig
  // dir) sees `@types/node`, exactly as a real source file would.
  const probePath = joinPath(dirname(tsConfigFilePath), PROBE_PATH);
  const probe = project.createSourceFile(probePath, probeSource, { overwrite: true });
  const statement = probe.getStatements().at(-1);

  if (statement === undefined || !Node.isExpressionStatement(statement)) {
    return { usable: false };
  }

  const expression = statement.getExpression();
  const root = Node.isPropertyAccessExpression(expression) ? expression.getExpression() : expression;
  // An import binding is an ALIAS — chase it to the aliased symbol so a value read's declText is the
  // dependency's own `.d.ts` (`node:path`), not the throwaway probe. A global (`process`) is no alias,
  // so it falls back to its own declaration exactly as before.
  const rootSymbol = root.getSymbol();
  const rootDeclaration = (rootSymbol?.getAliasedSymbol() ?? rootSymbol)?.getDeclarations()[0];

  if (called) {
    const [signature] = expression.getType().getCallSignatures();

    if (signature === undefined) {
      return { usable: false };
    }

    // The signature's own declaration carries a type node per parameter and one for the return type, in
    // the SAME order `getParameters()` reports — the one handle this branch has on a template literal
    // type, which the checker's `Type` API alone cannot decompose (see the reader's own PURPOSE doc). Not
    // every declaration shape a signature can carry has these (a constructor has no return type node), so
    // both reads stay optional.
    const sigDeclaration = signature.getDeclaration();
    const sigParamNodes = 'getParameters' in sigDeclaration ? sigDeclaration.getParameters() : undefined;
    const sigReturnNode = 'getReturnTypeNode' in sigDeclaration ? sigDeclaration.getReturnTypeNode() : undefined;

    const params = signature.getParameters().map((symbol, index) =>
      paramDescriptorContract.parse({
        name: symbol.getName(),
        type: typeDescriptorTransformer({
          fact: readGlobalTypeLayerBroker({
            type: symbol.getTypeAtLocation(expression),
            typeNode: sigParamNodes?.[index]?.getTypeNode(),
          }),
        }),
      }),
    );
    const returnType = typeDescriptorTransformer({
      fact: readGlobalTypeLayerBroker({ type: signature.getReturnType(), typeNode: sigReturnNode }),
    });
    const declFile = signature.getDeclaration().getSourceFile();

    return {
      usable: true,
      result: 'signature',
      signature: externalSignatureContract.parse({ params, returnType }),
      declText: declFile.getFullText(),
    };
  }

  // A member access that is not called resolves only when its root global is a real declaration
  // (`process` from `@types/node`); an unresolved root ships no usable types.
  if (rootDeclaration === undefined) {
    return { usable: false };
  }

  // The accessed member's (or the bare global's) own declaration — a PropertySignature for
  // `process.env`, a VariableDeclaration for a bare ambient `declare const` — carries the type node a
  // template literal type needs to decompose. Reading `expression.getSymbol()` here, rather than
  // `rootSymbol` above, resolves the MEMBER itself when `expression` is a property access, not its root.
  const memberDeclaration = expression.getSymbol()?.getDeclarations()[0];
  const memberTypeNode =
    memberDeclaration !== undefined &&
    (Node.isVariableDeclaration(memberDeclaration) ||
      Node.isPropertySignature(memberDeclaration) ||
      Node.isPropertyDeclaration(memberDeclaration))
      ? memberDeclaration.getTypeNode()
      : undefined;

  return {
    usable: true,
    result: 'type',
    type: typeDescriptorTransformer({ fact: readGlobalTypeLayerBroker({ type: expression.getType(), typeNode: memberTypeNode }) }),
    declText: rootDeclaration.getSourceFile().getFullText(),
  };
};
