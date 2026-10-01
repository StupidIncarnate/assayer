/**
 * PURPOSE: Reads the declared signature of ONE exported callable from a resolved `.d.ts`, using a
 *   SECOND ts-morph project built WITHOUT `useInMemoryFileSystem` (rooted at the consumer repo via its
 *   tsconfig, so `node_modules`/`@types` resolve) — kept strictly separate from the hermetic walk
 *   project, whose lack of ambient dependency types is load-bearing. The export's declaration node
 *   yields its `getParameters()`/`getReturnType()`; a typed-const export falls back to the first call
 *   signature of its type. Each type flows through the same `typeDescriptorTransformer` the local walk
 *   uses, so an external callable is described in exactly the analysis model a local scope record
 *   carries — no new type language. A generic degrades to `unknown`, an overload takes signature `[0]`.
 *   When the export names no callable, it ships no usable types.
 *
 *   ONE reusable project per tsconfig: constructing it is expensive, reading a declaration into
 *   serializable facts is pure, so every importer reuses the same resolved program.
 *
 * USAGE:
 * externalSignatureReadDeclarationBroker({ tsConfigFilePath, dtsPath, exportName });
 * // Returns { usable: true, signature: { params: [...], returnType: {...} } } or { usable: false }
 */
import { externalSignatureReadDeclarationResultContract } from '../../../contracts/external-signature-read-declaration-result/external-signature-read-declaration-result-contract';
import type { ExternalSignatureReadDeclarationResult } from '../../../contracts/external-signature-read-declaration-result/external-signature-read-declaration-result-contract';
import { Node, Project } from '#gateway/npm/ts-morph';

import { externalSignatureContract, paramDescriptorContract } from '@assayer/shared/contracts';

import { typeDescriptorTransformer } from '../../../transformers/type-descriptor/type-descriptor-transformer';
import { readSignatureTypeLayerBroker } from './read-signature-type-layer-broker';

const projectByConfig = new Map<string, Project>();

export const externalSignatureReadDeclarationBroker = ({
  tsConfigFilePath,
  dtsPath,
  exportName,
}: {
  tsConfigFilePath: string;
  dtsPath: string;
  exportName: string;
}): ExternalSignatureReadDeclarationResult => {
  const existing = projectByConfig.get(tsConfigFilePath);
  const project = existing ?? new Project({ tsConfigFilePath: tsConfigFilePath, skipAddingFilesFromTsConfig: true });
  if (existing === undefined) {
    projectByConfig.set(tsConfigFilePath, project);
  }

  const sourceFile = project.getSourceFile(dtsPath) ?? project.addSourceFileAtPath(dtsPath);
  const [declaration] = sourceFile.getExportedDeclarations().get(exportName) ?? [];

  if (declaration === undefined) {
    return externalSignatureReadDeclarationResultContract.parse({ usable: false });
  }

  if (Node.isFunctionDeclaration(declaration)) {
    const params = declaration.getParameters().map((param) =>
      paramDescriptorContract.parse({
        name: param.getName(),
        type: typeDescriptorTransformer({
          fact: readSignatureTypeLayerBroker({ type: param.getType(), typeNode: param.getTypeNode() }),
        }),
      }),
    );
    const returnType = typeDescriptorTransformer({
      fact: readSignatureTypeLayerBroker({ type: declaration.getReturnType(), typeNode: declaration.getReturnTypeNode() }),
    });

    return externalSignatureReadDeclarationResultContract.parse({ usable: true, signature: externalSignatureContract.parse({ params, returnType }) });
  }

  const [signature] = declaration.getType().getCallSignatures();

  if (signature === undefined) {
    return externalSignatureReadDeclarationResultContract.parse({ usable: false });
  }

  // The signature's own declaration (a typed const's `(t: string) => string`, for example) carries a
  // type node per parameter and one for the return type, in the SAME order `getParameters()` reports —
  // the one handle this branch has on a template literal type, which the checker's `Type` API alone
  // cannot decompose (see the reader's own PURPOSE doc). Not every declaration shape a signature can
  // carry has these (a constructor has no return type node), so both reads stay optional.
  const sigDeclaration = signature.getDeclaration();
  const sigParamNodes = 'getParameters' in sigDeclaration ? sigDeclaration.getParameters() : undefined;
  const sigReturnNode = 'getReturnTypeNode' in sigDeclaration ? sigDeclaration.getReturnTypeNode() : undefined;

  const params = signature.getParameters().map((symbol, index) =>
    paramDescriptorContract.parse({
      name: symbol.getName(),
      type: typeDescriptorTransformer({
        fact: readSignatureTypeLayerBroker({
          type: symbol.getTypeAtLocation(declaration),
          typeNode: sigParamNodes?.[index]?.getTypeNode(),
        }),
      }),
    }),
  );
  const returnType = typeDescriptorTransformer({
    fact: readSignatureTypeLayerBroker({ type: signature.getReturnType(), typeNode: sigReturnNode }),
  });

  return externalSignatureReadDeclarationResultContract.parse({ usable: true, signature: externalSignatureContract.parse({ params, returnType }) });
};
