/**
 * PURPOSE: The one place that words a generated test's `it` title from its prediction. Reach for
 * this when a test title is needed, so the title rule is not repeated in the test writer.
 *
 * USAGE:
 * specimenTestTitleTransformer({ provenance: 'param', varyingLeaf: 'value', prediction });
 * // Returns 'VALID: {value: param} => if on line 2 driven both ways, every case passes'
 */
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import type { SpecimenOutcome } from '../../contracts/specimen-outcome/specimen-outcome-contract';

const drivenWords: Record<SpecimenOutcome['branches'][number]['driven'], string> = {
  'both-ways': 'driven both ways',
  'one-way': 'locked one way',
  never: 'never run',
};

export const specimenTestTitleTransformer = ({
  provenance,
  varyingLeaf,
  prediction,
}: {
  provenance: Provenance;
  varyingLeaf: string;
  prediction: SpecimenOutcome;
}): string => {
  const branchText = [...prediction.branches]
    .sort((left, right) => left.line - right.line)
    .map(({ kind, line, driven }) => `${kind} on line ${line} ${drivenWords[driven]}`)
    .join('; ');
  const lintTexts = [...prediction.lints]
    .sort((left, right) => left.startLine - right.startLine)
    .map(({ rule, startLine }) => `${rule} on line ${startLine}`);
  const [firstUndriven] = [...prediction.undriven].sort((left, right) => left.startLine - right.startLine);

  const parts = [
    ...(branchText === '' ? [] : [branchText]),
    ...lintTexts,
    ...(firstUndriven === undefined ? [] : [`undriven from line ${firstUndriven.startLine}`]),
    'every case passes',
  ];

  return `VALID: {${varyingLeaf}: ${provenance}} => ${parts.join(', ')}`;
};
