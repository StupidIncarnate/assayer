/**
 * PURPOSE: Turns one resolved edge into the structured Contracts-tab inspector entry the detail panel
 *   renders — the symbol, its source (`import '<path>' → <def>` for a local import, the specifier as
 *   written for a node builtin (`node:path`), `pkg <name>` for a real package, `global` for an ambient
 *   global), one `name: type` input line per param (the star of the section; empty when the callable
 *   takes none), and the `returns <type>` output line — or the `type <type>` line for a value binding
 *   (a member-access global, or a package/builtin bound as a value) that carries a type not a signature.
 *
 *   If the app rendered a file at all its imports ARE resolved (an unresolvable one is a hard build
 *   error with no cache to open), so there is no `RESOLVED` noise: what is useful is the TYPE CONTRACT.
 *   DISPLAY only — nothing here feeds analysis.
 *
 * USAGE:
 * resolvedEdgeContractTransformer({ edge });
 * // Returns { symbol, source, inputs: ['name: string'], output: 'returns string' }
 */
import type { ResolvedEdge } from '@assayer/shared/contracts';

import { resolvedContractViewContract } from '../../contracts/resolved-contract-view/resolved-contract-view-contract';
import type { ResolvedContractView } from '../../contracts/resolved-contract-view/resolved-contract-view-contract';
import { typeDescriptorTextTransformer } from '../type-descriptor-text/type-descriptor-text-transformer';

export const resolvedEdgeContractTransformer = ({ edge }: { edge: ResolvedEdge }): ResolvedContractView => {
  const { target } = edge;

  // An ambient global is USED, never imported — its source is simply `global`. A called method carries
  // a signature (input + return); a member access (`process.env`) carries the member's TYPE instead.
  if (target.kind === 'global') {
    const symbol = target.member === undefined ? String(target.name) : `${String(target.name)}.${String(target.member)}`;
    const inputs =
      target.signature === undefined
        ? []
        : target.signature.params.map(
            (param) => `${String(param.name)}: ${String(typeDescriptorTextTransformer({ type: param.type }))}`,
          );
    const output =
      target.signature === undefined
        ? target.type === undefined
          ? undefined
          : `type ${String(typeDescriptorTextTransformer({ type: target.type }))}`
        : `returns ${String(typeDescriptorTextTransformer({ type: target.signature.returnType }))}`;

    return resolvedContractViewContract.parse({
      symbol,
      source: 'global',
      inputs,
      ...(output === undefined ? {} : { output }),
    });
  }

  const symbol = edge.importedName === undefined ? `import '${String(edge.specifier)}'` : String(edge.importedName);
  // A builtin's source is its module specifier as written (`node:path`) — it is imported, not a bare
  // package. A real package reads `pkg <name>`; a local import shows the resolved definition path.
  const source =
    target.kind === 'local'
      ? `import '${String(edge.specifier)}' → ${String(target.relPath)}`
      : target.kind === 'builtin'
        ? String(edge.specifier)
        : `pkg ${String(target.packageName)}`;
  const inputs =
    target.signature === undefined
      ? []
      : target.signature.params.map(
          (param) => `${String(param.name)}: ${String(typeDescriptorTextTransformer({ type: param.type }))}`,
        );
  // A CALLED import shows its return type; a package/builtin bound as a VALUE (`const sep = sep`) shows
  // its declared type instead — mirroring the ambient-global arm above.
  const targetType = target.kind === 'local' ? undefined : target.type;
  const output =
    target.signature === undefined
      ? targetType === undefined
        ? undefined
        : `type ${String(typeDescriptorTextTransformer({ type: targetType }))}`
      : `returns ${String(typeDescriptorTextTransformer({ type: target.signature.returnType }))}`;

  return resolvedContractViewContract.parse({ symbol, source, inputs, ...(output === undefined ? {} : { output }) });
};
