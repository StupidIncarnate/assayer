/**
 * PURPOSE: One case row of the Tests tab — its run status marker, what the runner calls with which
 *   arrange values, the exit it reaches (or `predicted` when the run did not pass it), the INTELLIGENT
 *   badge on a salient case, and under a case the run did not pass, WHY it did not. The row dims when
 *   another line is hovered or when runMode is `intelligent` and the case is not salient.
 *
 * USAGE:
 * <TestCaseLayerWidget fn={fn} testCase={testCase} driver={driver} entryLabel={entryLabel} isModule={false} />
 * // Renders `<marker> <driver>(<arrange>) → reaches L<line>` and, for a settled case, its outcome line
 */
import type { ReactElement } from '#gateway/npm/react';
import { Box, Group, Text } from '#gateway/npm/mantine__core';
import type { FunctionAnalysis, RunResult } from '@assayer/shared/contracts';
import { arrangeTextTransformer } from '@assayer/shared/transformers';

import { caseRunResultTransformer } from '../../transformers/case-run-result/case-run-result-transformer';
import { caseRunStatusTransformer } from '../../transformers/case-run-status/case-run-status-transformer';
import { caseTouchedLinesTransformer } from '../../transformers/case-touched-lines/case-touched-lines-transformer';
import { runStatusStatics } from '../../statics/run-status/run-status-statics';
import { runModeStatics } from '../../statics/run-mode/run-mode-statics';
import type { RunMode } from '../../contracts/status-view/status-view-contract';

export interface TestCaseLayerWidgetProps {
  fn: FunctionAnalysis;
  testCase: FunctionAnalysis['cases'][number];
  driver: string;
  entryLabel: string;
  isModule: boolean;
  hoveredLine?: number | null | undefined;
  run?: RunResult | undefined;
  runMode?: RunMode | undefined;
}

export const TestCaseLayerWidget = ({
  fn,
  testCase,
  driver,
  entryLabel,
  isModule,
  hoveredLine,
  run,
  runMode,
}: TestCaseLayerWidgetProps): ReactElement => {
  const active = hoveredLine !== undefined && hoveredLine !== null;
  const exit = fn.exits.find((candidate) => candidate.coverageId === testCase.reachesPath[0]);
  const touched = caseTouchedLinesTransformer({
    functionAnalysis: fn,
    reachesPath: testCase.reachesPath,
  });
  const isMatch = active && touched.some((line) => line === hoveredLine);
  const status = caseRunStatusTransformer({ run, testCase });
  const result = caseRunResultTransformer({ run, testCase });
  // A case the run did not pass never reached the exit on this row, so the row says
  // `predicted` rather than `reaches`. Printing the derived exit as though the run
  // landed there is the panel asserting an outcome that did not happen — and it
  // makes a case that THREW read identically to one that merely came out elsewhere.
  const settled = result !== undefined && status !== 'passed';
  const reach = `${settled ? 'predicted' : 'reaches'} L${exit?.line ?? '?'}`;
  // Why it did not pass, in this panel's own L-number vocabulary. An errored case
  // carries the runner's message (it threw, was not callable, fired no exit probe);
  // a failed one has no message and is explained by where it DID come out.
  const observed = (result?.observedPath ?? [])
    .map((id) => `L${String(fn.exits.find((candidate) => candidate.coverageId === id)?.line ?? '?')}`)
    .join(' → ');
  const outcome = result?.message ?? (observed === '' ? 'reached no exit' : `reached ${observed}`);
  // Display-only: under 'intelligent' the non-salient breadth grays out; 'thorough'
  // (the default, and any runMode the panel is not told) leaves every row live. This
  // never changes what the run engine executes — only how a reviewer reads the set.
  const grayed = runMode === 'intelligent' && !testCase.salient;

  return (
    <Box>
      <Group gap={6} wrap="nowrap" align="baseline">
        <Text
          data-testid="TEST_CASE_ROW"
          data-match={isMatch ? 'true' : 'false'}
          data-status={status}
          data-running={grayed ? 'false' : 'true'}
          ff="monospace"
          fz="xs"
          c={grayed || (active && !isMatch) ? 'dark.3' : 'gray.4'}
          style={{
            backgroundColor: !grayed && isMatch ? 'var(--mantine-color-blue-9)' : undefined,
            borderRadius: 2,
            paddingInline: 4,
          }}
        >
          <Text
            span
            data-testid="CASE_STATUS"
            fz="xs"
            fw={600}
            c={runStatusStatics.colour[status as keyof typeof runStatusStatics.colour]}
          >
            {`${runStatusStatics.marker[status as keyof typeof runStatusStatics.marker]} `}
          </Text>
          {isModule
            ? `${entryLabel} → ${reach}`
            : `${driver}(${arrangeTextTransformer({
                arrange: testCase.arrange,
              })}) → ${reach}`}
        </Text>
        {/* The salient (must-run) marker — its own inline span like CASE_STATUS, but a
            SIBLING of the row so it never enters the row's asserted text. It rides every
            salient row regardless of runMode; a non-salient row shows none. */}
        {testCase.salient ? (
          <Text span data-testid="INTELLIGENT_BADGE" fz="xs" fw={600} c={runModeStatics.colour.intelligent}>
            {runModeStatics.marker.intelligent}
          </Text>
        ) : null}
      </Group>
      {/* WHY it did not pass, on the row itself. Without this the tab shows that a case
          failed and never what went wrong, so the reason lives only in the run console —
          a panel that opens on Run, can be dismissed, and is empty for a run someone did
          in a terminal. A case that threw is exactly the one a reader must not have to
          re-run to understand. */}
      {settled ? (
        <Text
          data-testid="CASE_OUTCOME"
          ff="monospace"
          fz="xs"
          c={runStatusStatics.colour[status as keyof typeof runStatusStatics.colour]}
          pl={30}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {outcome}
        </Text>
      ) : null}
    </Box>
  );
};
