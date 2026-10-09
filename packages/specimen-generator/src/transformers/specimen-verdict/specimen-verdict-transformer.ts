/**
 * PURPOSE: Decides whether Assayer should drive a specimen, lock it to one arm, or admit it as
 * undriven, from where its leaves' values come from. The prediction and the manifest both read this,
 * so the two can never disagree about a specimen's verdict.
 *
 * Any leaf from outside the program makes the specimen undriven, because Assayer cannot set it. Else
 * any leaf a test sets makes it driven. Else every leaf is known, and the specimen is locked.
 *
 * USAGE:
 * specimenVerdictTransformer({ provenances: ['param', 'literal'] });
 * // Returns 'driven'
 */
import type { ManifestEntry } from '../../contracts/manifest-entry/manifest-entry-contract';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import { provenanceStatics } from '../../statics/provenance/provenance-statics';

export const specimenVerdictTransformer = ({
  provenances,
}: {
  provenances: readonly Provenance[];
}): ManifestEntry['verdict'] => {
  const tests = provenances.map((provenance) => provenanceStatics[provenance].test);

  // A pinned leaf needs Assayer to pin a builtin's result, which it cannot do yet. The matrix leaves
  // the `random` provenance out, so reaching this means the matrix and this rule disagree.
  if (tests.some((test) => test === 'pinned')) {
    throw new Error(
      `specimen verdict: a leaf has a pinned provenance (${provenances.join(', ')}), and no verdict rule covers pinning yet. Remove 'random' from matrixStatics.provenances, or add a pinning rule here.`,
    );
  }

  if (tests.some((test) => test === 'unsettable')) {
    return 'undriven';
  }

  if (tests.some((test) => test === 'sets')) {
    return 'driven';
  }

  return 'locked';
};
