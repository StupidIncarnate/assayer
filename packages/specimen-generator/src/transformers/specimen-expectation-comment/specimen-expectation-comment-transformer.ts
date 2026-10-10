/**
 * PURPOSE: Formats an expectation comment block for a generated specimen file.
 * The block records the full original specimen name, the verdict, and the
 * expected branches, lints, undriven lines, dark spots, and gaps predicted for Assayer.
 *
 * USAGE:
 * specimenExpectationCommentTransformer({ focusLabel: 'if-number', containerName: 'arrow-function', slotName: 'body', multiSlot: false, path: ['cond'], provenance: 'param', verdict: 'driven', prediction });
 * // Returns a multiline JSDoc comment string
 */
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import type { SpecimenOutcome } from '../../contracts/specimen-outcome/specimen-outcome-contract';

export const specimenExpectationCommentTransformer = ({
  focusLabel,
  containerName,
  slotName,
  multiSlot,
  path,
  provenance,
  verdict,
  prediction,
}: {
  focusLabel: string;
  containerName: string;
  slotName: string;
  multiSlot: boolean;
  path: readonly string[];
  provenance: Provenance;
  verdict: string;
  prediction: SpecimenOutcome;
}): string => {
  const originalName = [
    focusLabel,
    containerName,
    ...(multiSlot ? [slotName] : []),
    ...path.map((part) => part.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()),
    provenance,
  ].join('-');

  const branchLines =
    prediction.branches.length === 0
      ? [' * - none']
      : prediction.branches.map(({ kind, arm, line, driven }) => ` * - ${kind} ${arm} on line ${line}: ${driven}`);
  const lintLines =
    prediction.lints.length === 0
      ? [' * - none']
      : prediction.lints.map(({ rule, startLine }) => ` * - ${rule} on line ${startLine}`);
  const undrivenLines =
    prediction.undriven.length === 0
      ? [' * - none']
      : prediction.undriven.map(({ startLine }) => ` * - line ${startLine}`);
  const darkSpotLines =
    prediction.darkSpots.length === 0
      ? [' * - none']
      : prediction.darkSpots.map(({ startLine }) => ` * - line ${startLine}`);
  const gapLines =
    prediction.gaps.length === 0
      ? [' * - none']
      : prediction.gaps.map(({ name }) => ` * - ${name}`);

  const lines = [
    '/**',
    ` * Specimen: ${originalName}`,
    ' *',
    ` * Verdict: ${verdict}`,
    ' *',
    ' * Expected branches:',
    ...branchLines,
    ' *',
    ' * Expected lint errors:',
    ...lintLines,
    ' *',
    ' * Expected undriven errors:',
    ...undrivenLines,
    ' *',
    ' * Expected dark spot errors:',
    ...darkSpotLines,
    ' *',
    ' * Expected gap errors:',
    ...gapLines,
    ' */',
  ];

  return lines.join('\n');
};
