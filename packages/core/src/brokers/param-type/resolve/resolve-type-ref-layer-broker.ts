/**
 * PURPOSE: Resolves ONE type REFERENCE to the type its DECLARATION denotes — the recursive heart of
 *   the consume-time type resolution. A name the file declares itself is answered off the walk's
 *   `declaredShapes`; a name it imports is followed through the module edge that binds it, to the
 *   sibling on disk, and asked there under the name the sibling EXPORTS it as (never the local alias).
 *   Re-export barrels forward the question on, named or `export *` alike, so a type reached through a
 *   barrel resolves to the same shape as one imported straight from its definition. A NAMESPACE import
 *   is the same edge read one level in: `import * as T` binds every export of the module under `T`, so
 *   `T.Leaf` forwards `Leaf` to that specifier.
 *
 *   A GENERIC declaration is resolved against the reference's type ARGUMENTS: `type Box<T> = { value: T }`
 *   denotes nothing constructible on its own, and only `Box<string>` says what `T` is. The arguments are
 *   resolved in the READER's file — they are what the reader wrote — and substituted for the
 *   declaration's type parameters by position, so the shape that comes back is the instantiated one.
 *
 *   The answer is fully resolved: the declaration's own opaque references are resolved in the DEFINING
 *   file's context before it is returned, so `interface Config { db: Db }` comes back with `db` filled
 *   in whether `Db` is declared beside it or imported one file further out.
 *
 *   `seen` keys on `(file, reference)` and is what terminates a cycle — a type that re-enters itself
 *   resolves to `undefined` on the second visit and the reference is simply left opaque, which the fill
 *   seam then judges on its own terms (an OPTIONAL property carrying it is owed nothing, so a type-only
 *   import cycle still yields a buildable shape). Recursion, never a loop, and the seen-set is the only
 *   guard needed because the walk never crossed a file in the first place.
 *
 *   `undefined` means "no in-repo declaration names this" — a package type, a builtin, a broken
 *   specifier, or a cycle. The caller leaves the reference exactly as the walk read it.
 *
 * USAGE:
 * resolveTypeRefLayerBroker({ reference, walked, relPath: 'src/reader.ts', root: '/repo', options, seen: new Set() });
 * // Returns { kind: 'object', typeName: 'Config', properties: [...] } or undefined
 */
import { symbolNameContract, typeDescriptorContract } from '@assayer/shared/contracts';
import type { TypeDescriptor } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { collectTypeRefsTransformer } from '../../../transformers/collect-type-refs/collect-type-refs-transformer';
import { substituteTypeRefsTransformer } from '../../../transformers/substitute-type-refs/substitute-type-refs-transformer';
import { typeRefKeyTransformer } from '../../../transformers/type-ref-key/type-ref-key-transformer';
import { resolveSiblingCalleeBroker } from '../../resolve-sibling/callee/resolve-sibling-callee-broker';

export const resolveTypeRefLayerBroker = ({
  reference,
  walked,
  relPath,
  root,
  options,
  seen,
}: {
  reference: TypeDescriptor;
  walked: WalkFileResult;
  relPath: string;
  root: string;
  options: Parameters<typeof resolveSiblingCalleeBroker>[0]['options'];
  seen: ReadonlySet<string>;
}): TypeDescriptor | undefined => {
  // Only an OPAQUE descriptor carries a reference; anything already enumerated needs no resolving.
  const typeRef = reference.kind === 'unknown' ? reference.typeRef : undefined;
  const typeArgs = reference.kind === 'unknown' ? reference.typeArgs : undefined;

  if (!walked.success || typeRef === undefined) {
    return undefined;
  }

  const key = `${relPath}#${String(typeRefKeyTransformer({ type: reference }))}`;

  if (seen.has(key)) {
    return undefined;
  }

  const visited = new Set([...seen, key]);
  // The reference's type ARGUMENTS, resolved HERE — in the file that wrote them, which is the only
  // place they mean anything. They then travel the forward chain already concrete, so the declaration
  // one or three files over is instantiated with the reader's types rather than re-resolving names the
  // definer never saw. An argument nothing resolves stays exactly as read, and is refused honestly.
  const resolvedArgs = (typeArgs ?? []).map(
    (argument) =>
      resolveTypeRefLayerBroker({ reference: argument, walked, relPath, root, options, seen: visited }) ?? argument,
  );
  // A NAMESPACE-qualified reference (`T.Leaf`) names a module, not a local declaration. Its root is the
  // local binding an `import * as T` made, and only the member after it is the type to ask for.
  const [namespaceRoot, ...memberPath] = String(typeRef).split('.');
  const memberName = memberPath.join('.');
  const declared =
    memberName.length > 0 ? undefined : walked.declaredShapes.find((shape) => String(shape.name) === String(typeRef));

  if (declared !== undefined) {
    // The declaration's OWN references, resolved in the file that declares it — which is the only place
    // its imports mean anything. What stays unresolved stays opaque, so a shape with one unbuildable
    // REQUIRED property is still refused rather than silently completed.
    const nested = new Map(
      collectTypeRefsTransformer({ type: declared.type }).flatMap((inner) => {
        const resolved = resolveTypeRefLayerBroker({ reference: inner, walked, relPath, root, options, seen: visited });

        return resolved === undefined ? [] : [[String(typeRefKeyTransformer({ type: inner })), resolved] as const];
      }),
    );
    // The reference's type ARGUMENTS filling the declaration's type PARAMETERS by position, each
    // resolved in the READER's file because that is where the reader wrote them. A parameter with no
    // argument keeps its placeholder, which stays opaque and is refused honestly.
    const substituted = (declared.typeParams ?? []).flatMap((parameterName, index) => {
      const argument = resolvedArgs[index];

      return argument === undefined ? [] : [[String(parameterName), argument] as const];
    });

    return substituteTypeRefsTransformer({
      type: declared.type,
      resolved: new Map([...nested, ...substituted]),
    });
  }

  // Not declared here, so it arrived through a module edge. A NAMED binding forwards the question under
  // the SOURCE name (an `import { Config as Cfg }` asks the sibling for `Config`); a NAMESPACE binding
  // forwards the member off it (`import * as T` then `T.Leaf` asks for `Leaf`); a bare `export *`
  // forwards it unchanged, and each star is tried in declaration order until one answers.
  const forwards = walked.moduleEdges.flatMap((edge) => {
    if (edge.specifier === undefined || String(edge.kind) === 'dynamic') {
      return [];
    }

    if (memberName.length > 0) {
      return edge.bindings.some((binding) => binding.kind === 'namespace' && String(binding.local) === namespaceRoot)
        ? [{ specifier: String(edge.specifier), exportedName: symbolNameContract.parse(memberName) }]
        : [];
    }

    const named = edge.bindings.find(
      (binding) => binding.kind === 'named' && String(binding.alias ?? binding.name) === String(typeRef),
    );

    if (named?.kind === 'named') {
      return [{ specifier: String(edge.specifier), exportedName: symbolNameContract.parse(named.name) }];
    }

    return edge.bindings.some((binding) => binding.kind === 'star')
      ? [{ specifier: String(edge.specifier), exportedName: typeRef }]
      : [];
  });

  const [answer] = forwards.flatMap((forward) => {
    const sibling = resolveSiblingCalleeBroker({
      specifier: forward.specifier,
      containingFile: `${root}/${relPath}`,
      root,
      options,
    });

    if (sibling === undefined) {
      return [];
    }

    // Re-asked under the name the SIBLING exports, carrying the reader's type ARGUMENTS unchanged —
    // they are what the reader wrote, and the declaration one file over is the thing they instantiate.
    // The reader's own `text` rides along as the seen-set's identity for this hop; it is a key, and the
    // (file, reference) pair it forms is what terminates a cycle.
    const forwarded = typeDescriptorContract.parse({
      kind: 'unknown',
      text: typeRefKeyTransformer({ type: reference }),
      typeRef: forward.exportedName,
      ...(resolvedArgs.length === 0 ? {} : { typeArgs: resolvedArgs }),
    });
    const resolved = resolveTypeRefLayerBroker({
      reference: forwarded,
      walked: sibling.walked,
      relPath: String(sibling.relPath),
      root,
      options,
      seen: visited,
    });

    return resolved === undefined ? [] : [resolved];
  });

  return answer;
};
