/**
 * PURPOSE: Drives an object-member branch (`if (config.mode === 'a')`) from the merged stub view — the
 *   consume-time overlay that turns a branch the per-file walk admitted UNDRIVEN into real, runnable
 *   cases. A TWIN of `compose-cross-file-predicates-broker`: it is applied where a run is consumed,
 *   never baked into the per-file blob, and re-reads the stub view fresh per run. The per-file
 *   `derive-cases` gate refuses an object-member leaf because cause-arrange can only fill SCALAR params;
 *   this fills the OBJECT param instead, arranging each property from the value the merged stub carries.
 *
 *   For every entry whose branches ALL turn on object members of a stubbable type, it builds that type's
 *   merged stub view — the derived per-property demands (`collect-property-demands`, the SAME value math
 *   the stub stitch runs) combined with the committed overlay (`stub-view`, where a human correction
 *   WINS) — enumerates the entry's input buckets (`input-buckets`, reused unchanged), and arranges the
 *   object param per bucket (`object-arrange`). Each bucket maps to the exit control flow reaches by the
 *   SAME maximal-guard-path rule `derive-cases` uses, and each case is marked `salient` (first per
 *   predicted output). The branch is thus DRIVEN, and the undriven admission it carried is dropped.
 *
 *   Every arrange value is an INPUT (a human correction or a derived demand), never a code-derived
 *   output (P4): the cases assert reaching an exit structurally, never a returned value. A same-file
 *   type is read from the analysis's `declaredTypes`; a cross-file type is resolved through the import
 *   the entry declares and its definition re-walked on disk — the same per-run sibling read compose
 *   does, so the persisted blob stays child-independent. A file with no object-member entry, or a type
 *   that resolves to no declared shape, is a same-reference pass-through that touches no disk.
 *
 * USAGE:
 * stubRealizeBroker({ analysis, walked, root: '/repo', relPath: 'src/decide.ts', overlays });
 * // Returns the FileAnalysis with object-member branches driven and their undriven admissions cleared
 */
import {
  derivedTestCaseContract,
  fileAnalysisContract,
  stubIndexContract,
} from '@assayer/shared/contracts';
import type {
  DeclaredType,
  DerivedTestCase,
  FileAnalysis,
  StubOverlay,
} from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { caseSignatureContract } from '../../../contracts/case-signature/case-signature-contract';
import type { CaseSignature } from '../../../contracts/case-signature/case-signature-contract';
import type { PredictedOutput } from '../../../contracts/predicted-output/predicted-output-contract';
import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { pathRelativeAdapter } from '../../../adapters/path/relative/path-relative-adapter';
import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { typescriptReadConfigAdapter } from '../../../adapters/typescript/read-config/typescript-read-config-adapter';
import { typescriptResolveModuleAdapter } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter';
import { collectPropertyDemandsTransformer } from '../../../transformers/collect-property-demands/collect-property-demands-transformer';
import { conditionLeavesTransformer } from '../../../transformers/condition-leaves/condition-leaves-transformer';
import { inputBucketsTransformer } from '../../../transformers/input-buckets/input-buckets-transformer';
import { objectArrangeTransformer } from '../../../transformers/object-arrange/object-arrange-transformer';
import { predictedOutputTransformer } from '../../../transformers/predicted-output/predicted-output-transformer';
import { representativeValueTransformer } from '../../../transformers/representative-value/representative-value-transformer';
import { stubViewTransformer } from '../../../transformers/stub-view/stub-view-transformer';
import { isObjectMemberLeafGuard } from '../../../guards/is-object-member-leaf/is-object-member-leaf-guard';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';

export const stubRealizeBroker = ({
  analysis,
  walked,
  root,
  relPath,
  overlays,
}: {
  analysis: FileAnalysis;
  walked: WalkFileResult;
  root: string;
  relPath: string;
  overlays: readonly StubOverlay[];
}): FileAnalysis => {
  if (!walked.success) {
    return analysis;
  }

  // An entry qualifies when it has branches, EVERY leaf of EVERY branch is an object-member read of one
  // of its params, and the per-file walk drove none of them (`cases: []`). Anything else is left to
  // derive-cases / compose — this rung only turns the fully-object-member undriven entries.
  const candidateEntries = analysis.functions.filter((fn) => {
    const leaves = fn.branches.flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition }));
    const paramNames = new Set(fn.entry.params.map((param) => String(param.name)));

    return (
      fn.branches.length > 0 &&
      fn.cases.length === 0 &&
      leaves.length > 0 &&
      leaves.every((leaf) => isObjectMemberLeafGuard({ leaf }) && paramNames.has(String(leaf.operandParamName)))
    );
  });

  if (candidateEntries.length === 0) {
    return analysis;
  }

  const sameFileTypes = new Map(analysis.declaredTypes.map((declared) => [String(declared.name), declared]));
  const allLeaves = candidateEntries.flatMap((fn) =>
    fn.branches.flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition })),
  );
  const typeRefs = [...new Set(allLeaves.map((leaf) => String(leaf.operandTypeRef)))];

  // The tsconfig is read ONCE, and only when a cross-file type has to be resolved — a same-file-only
  // entry (branch-local) never touches module resolution.
  const options = typeRefs.some((typeRef) => !sameFileTypes.has(typeRef))
    ? typescriptReadConfigAdapter({ searchPath: root }).options
    : undefined;

  // Each type-reference resolved to its declared shape + repo-relative definition path: a same-file type
  // reads off `declaredTypes`, a cross-file one resolves the import the file declares and re-walks the
  // definition on disk. Built as entries so the Map infers rather than annotating a raw string key.
  const resolvedTypes = new Map(
    typeRefs.flatMap((typeRef) => {
      const leaves = allLeaves.filter((leaf) => String(leaf.operandTypeRef) === typeRef);
      const local = sameFileTypes.get(typeRef);

      if (local !== undefined) {
        return [[typeRef, { declaredType: local, definitionRelPath: relPath, leaves }] as const];
      }

      const edge = walked.moduleEdges.find(
        (candidate) =>
          String(candidate.kind) === 'import' &&
          candidate.specifier !== undefined &&
          candidate.bindings.some(
            (binding) => binding.kind === 'named' && String(binding.alias ?? binding.name) === typeRef,
          ),
      );

      if (edge?.specifier === undefined || options === undefined) {
        return [];
      }

      const resolved = typescriptResolveModuleAdapter({
        specifier: String(edge.specifier),
        containingFile: `${root}/${relPath}`,
        options,
      });

      if (!resolved.resolved) {
        return [];
      }

      const fileName = String(resolved.fileName);
      const definitionRelPath = String(pathRelativeAdapter({ from: root, to: fileName }));

      if (definitionRelPath.startsWith('..') || fileName.includes('/node_modules/')) {
        return [];
      }

      const definitionWalk = tsMorphWalkFileAdapter({ source: fsReadFileSyncAdapter({ path: fileName }), relPath: definitionRelPath });
      const declaredType: DeclaredType | undefined = analyzeFileBroker({ walked: definitionWalk, relPath: definitionRelPath }).declaredTypes.find(
        (declared) => String(declared.name) === typeRef,
      );

      return declaredType === undefined ? [] : [[typeRef, { declaredType, definitionRelPath, leaves }] as const];
    }),
  );

  // Only entries whose every object-member type-reference resolved can be driven; one reading an
  // unresolvable type stays admitted undriven, exactly as the per-file walk left it.
  const drivable = candidateEntries.filter((fn) =>
    fn.branches
      .flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition }))
      .every((leaf) => resolvedTypes.has(String(leaf.operandTypeRef))),
  );

  if (drivable.length === 0) {
    return analysis;
  }

  // The merged stub view: each resolved type's derived per-property demands combined with the committed
  // overlay (a correction REPLACES the demanded values it names). Built once here, never persisted.
  const emptyHash = cryptoSha256Adapter({ content: '' });
  const objectStubs = [...resolvedTypes.entries()]
    .map(([typeRef, resolved]) => ({
      key: `${resolved.definitionRelPath}#${typeRef}`,
      definitionRelPath: resolved.definitionRelPath,
      typeName: resolved.declaredType.name,
      properties: collectPropertyDemandsTransformer({ declaredType: resolved.declaredType, leaves: resolved.leaves }),
      readers: [relPath],
    }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));

  const stubView = stubViewTransformer({
    index: stubIndexContract.parse({ layoutHash: emptyHash, tsconfigHash: emptyHash, objectStubs, envStubs: [] }),
    overlays,
  });
  const stubByKey = new Map(stubView.objectStubs.map((stub) => [String(stub.key), stub] as const));

  // The properties a committed overlay CORRECTS on each type — their corrected values are the
  // AUTHORITATIVE domain object-arrange uses (no fallback to the branch literal). Built once here.
  const correctedByKey = new Map(
    overlays.flatMap((overlay) =>
      overlay.kind === 'object' ? [[String(overlay.key), overlay.properties.map((property) => property.name)] as const] : [],
    ),
  );

  const functions = analysis.functions.map((fn) => {
    if (!drivable.includes(fn)) {
      return fn;
    }

    // The type each object param reads, keyed off the leaves so a param typed `any` in the hermetic walk
    // (a cross-file object) is still found by its read.
    const typeRefByParam = new Map(
      fn.branches
        .flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition }))
        .map((leaf) => [String(leaf.operandParamName), String(leaf.operandTypeRef)] as const),
    );

    // Each input bucket arranged and mapped to the exit control flow reaches: the MAXIMAL-length guard
    // path the bucket's arms satisfy, exactly as derive-cases picks it. A bucket whose object arrange is
    // unreachable (a property no value satisfies) or that reaches no single exit is dropped.
    const evaluated = inputBucketsTransformer({ branches: fn.branches }).map((bucket) => {
      const armByBranch = new Map(bucket.arms.map((step) => [String(step.branchCoverageId), String(step.arm)] as const));
      const consistent = fn.exits.filter((exit) =>
        exit.guardPath.every((step) => armByBranch.get(String(step.branchCoverageId)) === String(step.arm)),
      );
      const maxLength = consistent.reduce((longest, exit) => Math.max(longest, exit.guardPath.length), -1);
      const maximal = consistent.filter((exit) => exit.guardPath.length === maxLength);

      const arranged = fn.entry.params.map((param) => {
        const typeRef = typeRefByParam.get(String(param.name));
        const resolved = typeRef === undefined ? undefined : resolvedTypes.get(typeRef);
        const stub = resolved === undefined ? undefined : stubByKey.get(`${resolved.definitionRelPath}#${String(typeRef)}`);

        if (resolved === undefined || stub === undefined) {
          return { unreachable: false, binding: { kind: 'param' as const, param: param.name, value: representativeValueTransformer({ type: param.type }) } };
        }

        const objectArrange = objectArrangeTransformer({
          param: param.name,
          declaredType: resolved.declaredType,
          demands: stub.properties,
          requirements: bucket.requirements.filter(
            (requirement) => String(requirement.leaf.operandParamName) === String(param.name),
          ),
          corrected: correctedByKey.get(`${resolved.definitionRelPath}#${String(typeRef)}`) ?? [],
        });

        return {
          unreachable: objectArrange.unreachable,
          binding: {
            kind: 'object' as const,
            param: param.name,
            value: Object.fromEntries(objectArrange.properties.map((property) => [String(property.name), property.value])),
          },
        };
      });

      return {
        exit: maximal.length === 1 ? maximal[0] : undefined,
        unreachable: arranged.some((entry) => entry.unreachable),
        arrange: arranged.map((entry) => entry.binding),
      };
    });

    // Feasible buckets in enumeration order, de-duplicated by (exit, arrange), then marked salient — the
    // first per predicted output is the execution representative — exactly as derive-cases does.
    const seen = new Set<CaseSignature>();
    const feasible = evaluated.flatMap((entry) => {
      if (entry.exit === undefined || entry.unreachable) {
        return [];
      }

      const signature = caseSignatureContract.parse(`${String(entry.exit.coverageId)}::${JSON.stringify(entry.arrange)}`);

      if (seen.has(signature)) {
        return [];
      }
      seen.add(signature);

      return [{ reachesExit: entry.exit.coverageId, arrange: entry.arrange, predictedOutput: predictedOutputTransformer({ reachesExit: entry.exit.coverageId }) }];
    });

    const salientSeen = new Set<PredictedOutput>();
    const cases: DerivedTestCase[] = feasible.map((entry) => {
      const salient = !salientSeen.has(entry.predictedOutput);
      salientSeen.add(entry.predictedOutput);

      return derivedTestCaseContract.parse({ reachesExit: entry.reachesExit, arrange: entry.arrange, salient });
    });

    return { entry: fn.entry, branches: fn.branches, exits: fn.exits, cases };
  });

  // The stale branch admissions the per-file walk put on the now-driven entries, keyed by name + branch
  // line — the same key compose reconciles on. Every driven entry's admissions drop; nothing new is
  // owed, since its object-member branches are now driven.
  const staleUndrivenKeys = new Set(
    drivable.flatMap((fn) => fn.branches.map((branch) => `${String(fn.entry.name)}#${String(branch.startLine)}`)),
  );

  return fileAnalysisContract.parse({
    functions,
    enrichment: analysis.enrichment,
    darkSpots: analysis.darkSpots,
    undriven: analysis.undriven.filter(
      (entry) => !staleUndrivenKeys.has(`${String(entry.name)}#${String(entry.startLine)}`),
    ),
    lints: analysis.lints,
    declaredTypes: analysis.declaredTypes,
  });
};
