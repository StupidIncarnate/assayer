/**
 * PURPOSE: Formats a labeled progress bar line for CLI output — a fixed-width run of filled
 *   and empty glyphs (from progressBarStatics) followed by the current/max counts.
 *
 * USAGE:
 * progressBarLineFormatTransformer({ label: 'main', current: 5, max: 10 });
 * // Returns 'main: ##########---------- 5/10' as branded ProgressBarLine
 */
import { progressBarLineContract } from '../../contracts/progress-bar-line/progress-bar-line-contract';
import type { ProgressBarLine } from '../../contracts/progress-bar-line/progress-bar-line-contract';
import { progressBarStatics } from '../../statics/progress-bar/progress-bar-statics';

export const progressBarLineFormatTransformer = ({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}): ProgressBarLine => {
  const { width, filledChar, emptyChar } = progressBarStatics.bar;
  const ratio = max > 0 ? current / max : 0;
  const filled = Math.round(ratio * width);
  const bar = filledChar.repeat(filled) + emptyChar.repeat(width - filled);

  return progressBarLineContract.parse(`${label}: ${bar} ${current}/${max}`);
};
