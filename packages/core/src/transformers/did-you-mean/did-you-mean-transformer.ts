/**
 * PURPOSE: Picks the candidate name closest to one a reader spelled — the "did you mean" half of an
 *   error that would otherwise only say a name is unknown. Closeness is Levenshtein edit distance over
 *   the lower-cased names, so a case slip, a transposition and a single typo all land on the intended
 *   name.
 *
 *   There is no distance THRESHOLD, deliberately. The caller prints the full candidate list beside the
 *   suggestion, so a far-off guess costs a reader nothing while a threshold would silently withhold the
 *   one hint that helps when a name was badly mangled. Ties break on the candidate's own spelling, so
 *   the suggestion is deterministic — the same wrong name always earns the same advice.
 *
 * USAGE:
 * didYouMeanTransformer({ name: 'audot', candidates: ['audit', 'collect'] });
 * // Returns 'audit'
 */

export const didYouMeanTransformer = ({
  name,
  candidates,
}: {
  name: string;
  candidates: readonly string[];
}): string | undefined => {
  const target = Array.from(name.toLowerCase());

  const scored = candidates.map((candidate) => {
    const source = Array.from(candidate.toLowerCase());

    const finalRow = source.reduce(
      (previous, sourceChar, sourceIndex) =>
        target.reduce(
          (current, targetChar, targetIndex) => [
            ...current,
            Math.min(
              (previous[targetIndex + 1] ?? 0) + 1,
              (current[targetIndex] ?? 0) + 1,
              (previous[targetIndex] ?? 0) + (sourceChar === targetChar ? 0 : 1),
            ),
          ],
          [sourceIndex + 1],
        ),
      Array.from({ length: target.length + 1 }, (_value, index) => index),
    );

    return {
      candidate,
      distance: finalRow[target.length] ?? target.length,
    };
  });

  const ranked = [...scored].sort((a, b) =>
    a.distance === b.distance ? (a.candidate < b.candidate ? -1 : 1) : a.distance - b.distance,
  );

  return ranked[0]?.candidate;
};
