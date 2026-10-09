/**
 * PURPOSE: Groups the env-property reads feeding each `process.env` stub — the env twin of
 *   `gather-type-reads`, and the ONE place "which reads name property P, and which files read it" is
 *   decided. `process.env` is an object; each property it reads is a stubbable group keyed by the
 *   property NAME, unioning the literals every file compares it against and listing every reader.
 *
 *   Two facts on each finished blob feed it, neither re-parsing:
 *   - the module graph's `envReads` — bare `process.env.<X>` reads the walk captured, carrying the
 *     property and any equality-comparison literal (`process.env.MODE === 'production'`), and
 *   - the env-read branch leaves — a `Number(process.env.CODE)` discriminant reads as a branch leaf
 *     whose `operandEnvVarName` names the property and whose predicate literal is the case value. A
 *     leaf whose steps compare the variable (`process.env.FLAG === 'on'`) contributes that comparison's
 *     literal instead, because its predicate literal is a boolean, not a value of the variable. A
 *     length predicate contributes no literal: a length is not a value either.
 *   A file appears as a reader through EITHER, so an unbranched read and a switch-driving read both
 *   count. Iterated in sorted reader order and unioned so the collected literals and readers are
 *   byte-identical regardless of blob input order. The per-property value guess stays downstream.
 *
 * USAGE:
 * gatherEnvReadsTransformer({ blobs });
 * // Returns [{ property: 'CODE', literals: [1, 2], readers: ['src/multi-read.ts'] }, …]
 */
import { gatherEnvReadsContract } from '../../contracts/gather-env-reads/gather-env-reads-contract';
import type { GatherEnvReads } from '../../contracts/gather-env-reads/gather-env-reads-contract';
import { representativeValueContract } from '@assayer/shared/contracts';
import type { CompiledFileBlob, PredicateKind } from '@assayer/shared/contracts';

import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';

const VALUE_PREDICATES = new Set<PredicateKind>(['eq', 'neq', 'gt', 'gte', 'lt', 'lte']);

export const gatherEnvReadsTransformer = ({
  blobs,
}: {
  blobs: CompiledFileBlob[];
}): GatherEnvReads => {
  const reads = [...blobs]
    .sort((a, b) => (String(a.relPath) < String(b.relPath) ? -1 : 1))
    .flatMap((blob) => {
      const channelReads = blob.moduleGraph.envReads.map((read) => ({
        property: String(read.property),
        literals: read.literals,
        reader: blob.relPath,
      }));
      const leafReads = (blob.analysis?.functions ?? [])
        .flatMap((fn) => fn.branches)
        .flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition }))
        .flatMap((leaf) => {
          // A predicate literal is a value of the VARIABLE only while every step keeps the value as it
          // is, up to `Number`, and the predicate compares that value. After a comparison or a split the
          // literal is a boolean or a length, so the comparison step's own literal is the one recorded.
          const steps = leaf.operandEnvSteps ?? [];
          const valuePreserving = steps.every((step) => step.kind === 'default' || step.kind === 'number');
          const predicateLiterals =
            valuePreserving && leaf.predicate.literal !== undefined && VALUE_PREDICATES.has(leaf.predicate.kind)
              ? [leaf.predicate.literal]
              : [];
          const stepLiterals = steps.flatMap((step) =>
            step.kind === 'equals' ? [representativeValueContract.parse(step.literal)] : [],
          );

          return leaf.operandEnvVarName === undefined
            ? []
            : [
                {
                  property: String(leaf.operandEnvVarName),
                  literals: [...stepLiterals, ...predicateLiterals],
                  reader: blob.relPath,
                },
              ];
        });

      return [...channelReads, ...leafReads];
    });

  const properties = [...new Set(reads.map((read) => read.property))].sort((a, b) => (a < b ? -1 : 1));

  return gatherEnvReadsContract.parse(properties.map((property) => {
    const matching = reads.filter((read) => read.property === property);
    const literals = [
      ...new Map(matching.flatMap((read) => read.literals).map((value) => [JSON.stringify(value), value])).values(),
    ];
    const readers = [...new Set(matching.map((read) => String(read.reader)))]
      .sort((a, b) => (a < b ? -1 : 1))
      .map((reader) => reader);

    return { property, literals, readers };
  }));
};
