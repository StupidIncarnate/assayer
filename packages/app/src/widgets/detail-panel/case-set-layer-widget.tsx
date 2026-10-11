/**
 * PURPOSE: One labelled case set of an entry on the Tests tab — "Every route" or "Fewest runs" — with
 *   its count over one TestCaseLayerWidget per case. The label carries the set's explanation as a
 *   tooltip, so a reader can check Assayer accounted for every path and see which set it runs.
 *
 * USAGE:
 * <CaseSetLayerWidget set="fewest-runs" cases={fn.cases.filter((c) => c.fewestRuns)} fn={fn} driver={driver} entryLabel={entryLabel} isModule={false} />
 * // Renders `Fewest runs · N` over the case rows of that set
 */
import { memo } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import { Box, Stack, Text } from '#gateway/npm/mantine__core';
import type { FunctionAnalysis, RunResult } from '@assayer/shared/contracts';
import { arrangeTextTransformer } from '@assayer/shared/transformers';

import { caseSetStatics } from '../../statics/case-set/case-set-statics';
import { TestCaseLayerWidget } from './test-case-layer-widget';

export interface CaseSetLayerWidgetProps {
  set: 'every-route' | 'fewest-runs';
  cases: readonly FunctionAnalysis['cases'][number][];
  fn: FunctionAnalysis;
  driver: string;
  entryLabel: string;
  isModule: boolean;
  hoveredLine?: number | null | undefined;
  onLineHover?: ((line: number | null) => void) | undefined;
  run?: RunResult | undefined;
}

export const CaseSetLayerWidget = memo(
  ({ set, cases, fn, driver, entryLabel, isModule, hoveredLine, onLineHover, run }: CaseSetLayerWidgetProps): ReactElement => {
    const label = set === 'every-route' ? caseSetStatics.label.everyRoute : caseSetStatics.label.fewestRuns;
    const explanation = set === 'every-route' ? caseSetStatics.explanation.everyRoute : caseSetStatics.explanation.fewestRuns;

    return (
      <Box data-testid="CASE_SET" data-set={set} mt={6}>
        <Text data-testid="CASE_SET_LABEL" fz="xs" fw={600} c="gray.3" title={explanation}>
          {`${label} · ${String(cases.length)}`}
        </Text>
        <Stack gap={2} mt={2}>
          {cases.map((testCase) => (
            <TestCaseLayerWidget
              key={`${testCase.reachesPath.join('>')}#${arrangeTextTransformer({ arrange: testCase.arrange })}#${testCase.arms.map((step) => `${String(step.branchCoverageId)}:${String(step.arm)}`).join(',')}`}
              fn={fn}
              testCase={testCase}
              driver={driver}
              entryLabel={entryLabel}
              isModule={isModule}
              hoveredLine={hoveredLine}
              onLineHover={onLineHover}
              run={run}
              set={set}
            />
          ))}
        </Stack>
      </Box>
    );
  },
);
