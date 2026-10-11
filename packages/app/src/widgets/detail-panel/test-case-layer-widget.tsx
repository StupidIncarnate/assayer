/**
 * PURPOSE: One case row of the Tests tab — its run status marker, what the runner calls with which
 *   arrange values, the arms the route takes (`L2 then · L5 else`), the exit line and return value,
 *   an `undriven` marker when Assayer cannot steer a branch on the route, and under a case the run did
 *   not pass, WHY it did not. Only a driven case in the fewest-runs set is run: every other row is
 *   listed with `data-running="false"` and dims, as it also does when another line is hovered.
 *
 *   The `set` prop says which of an entry's two sets the row sits in. The Fewest runs set shows the
 *   compact form (status, call, arms, undriven marker); the Every route set shows the whole row.
 *
 * USAGE:
 * <TestCaseLayerWidget fn={fn} testCase={testCase} driver={driver} entryLabel={entryLabel} isModule={false} />
 * // Renders `<marker> <driver>(<arrange>)` over `  => <line>: <returnValue>`
 */
import { memo, useMemo } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import { Box, Group, Text } from '#gateway/npm/mantine__core';
import type { FunctionAnalysis, RunResult } from '@assayer/shared/contracts';
import { arrangeTextTransformer } from '@assayer/shared/transformers';

import { caseRunResultTransformer } from '../../transformers/case-run-result/case-run-result-transformer';
import { caseRunStatusTransformer } from '../../transformers/case-run-status/case-run-status-transformer';
import { caseTouchedLinesTransformer } from '../../transformers/case-touched-lines/case-touched-lines-transformer';
import { runStatusStatics } from '../../statics/run-status/run-status-statics';
import { caseSetStatics } from '../../statics/case-set/case-set-statics';

// The Every route set carries the whole row (status, call, arms, undriven marker, the exit it reaches and
// why a case did not pass). The Fewest runs set re-lists a subset of the same cases as a compact
// row under its own test ids, so each id stays unique on the panel.
const TEST_IDS = {
  'every-route': { row: 'TEST_CASE_ROW', status: 'CASE_STATUS', arms: 'CASE_ARMS', undriven: 'CASE_UNDRIVEN' },
  'fewest-runs': { row: 'FEWEST_RUNS_ROW', status: 'FEWEST_RUNS_STATUS', arms: 'FEWEST_RUNS_ARMS', undriven: 'FEWEST_RUNS_UNDRIVEN' },
} as const;

export interface TestCaseLayerWidgetProps {
  fn: FunctionAnalysis;
  testCase: FunctionAnalysis['cases'][number];
  driver: string;
  entryLabel: string;
  isModule: boolean;
  hoveredLine?: number | null | undefined;
  onLineHover?: ((line: number | null) => void) | undefined;
  run?: RunResult | undefined;
  set?: 'every-route' | 'fewest-runs' | undefined;
}

export const TestCaseLayerWidget = memo(
  ({
  fn,
  testCase,
  driver,
  entryLabel,
  isModule,
  hoveredLine,
  onLineHover,
  run,
  set,
}: TestCaseLayerWidgetProps): ReactElement => {
  const active = hoveredLine !== undefined && hoveredLine !== null;
  const exit = useMemo(
    () => fn.exits.find((candidate) => candidate.coverageId === testCase.reachesPath[0]),
    [fn.exits, testCase.reachesPath],
  );
  const touched = useMemo(
    () =>
      caseTouchedLinesTransformer({
        functionAnalysis: fn,
        reachesPath: testCase.reachesPath,
        arms: testCase.arms,
      }),
    [fn, testCase.reachesPath, testCase.arms],
  );
  const isMatch = active && touched.some((line) => line === hoveredLine);
  const status = useMemo(() => caseRunStatusTransformer({ run, testCase }), [run, testCase]);
  const result = useMemo(() => caseRunResultTransformer({ run, testCase }), [run, testCase]);
  // A case the run did not pass never reached the exit on this row, so the row says
  // `predicted` rather than `reaches`. Printing the derived exit as though the run
  // landed there is the panel asserting an outcome that did not happen — and it
  // makes a case that THREW read identically to one that merely came out elsewhere.
  const settled = result !== undefined && status !== 'passed';
  const exitEvent =
    status === 'passed' && result !== undefined
      ? [...result.trace].reverse().find((event) => event.kind === 'exit' && event.id === testCase.reachesPath[0])
      : undefined;
  const returnValue = exitEvent === undefined ? '(not run)' : exitEvent.valueText;
  // Why it did not pass, in this panel's own L-number vocabulary. An errored case
  // carries the runner's message (it threw, was not callable, fired no exit probe);
  // a failed one has no message and is explained by where it DID come out.
  const observed = (result?.observedPath ?? [])
    .map((id) => `L${String(fn.exits.find((candidate) => candidate.coverageId === id)?.line ?? '?')}`)
    .join(' → ');
  const outcome = result?.message ?? (observed === '' ? 'reached no exit' : `reached ${observed}`);
  // Only a driven case in the fewest-runs set is executed. Every other row is listed and dimmed, so a
  // reviewer can read the whole route set while seeing which cases actually run.
  const ids = TEST_IDS[set ?? 'every-route'];
  const compact = set === 'fewest-runs';
  const running = testCase.driven && testCase.fewestRuns;
  const grayed = !running;
  // The route, in this panel's own L-number vocabulary: one `L<branch line> <arm>` per branch it takes.
  const armsText = testCase.arms
    .map((step) => `L${String(fn.branches.find((candidate) => candidate.coverageId === step.branchCoverageId)?.startLine ?? '?')} ${String(step.arm)}`)
    .join(' · ');

  return (
    <Box
      onMouseEnter={() => {
        if (exit?.line !== undefined) {
          onLineHover?.(exit.line);
        }
      }}
      onMouseLeave={() => {
        onLineHover?.(null);
      }}
    >
      <Group gap={6} wrap="nowrap" align="baseline">
        <Text
          data-testid={ids.row}
          data-match={isMatch ? 'true' : 'false'}
          data-status={status}
          data-running={running ? 'true' : 'false'}
          data-driven={testCase.driven ? 'true' : 'false'}
          data-set={set}
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
            data-testid={ids.status}
            fz="xs"
            fw={600}
            c={runStatusStatics.colour[status]}
          >
            {`${runStatusStatics.marker[status]} `}
          </Text>
          {isModule
            ? entryLabel
            : `${driver}(${arrangeTextTransformer({
                arrange: testCase.arrange,
              })})`}
        </Text>
        {/* The route's arms and the undriven marker — their own inline spans, SIBLINGS of the row so
            they never enter the row's asserted text. */}
        {armsText === '' ? null : (
          <Text span data-testid={ids.arms} ff="monospace" fz="xs" c="dimmed">
            {armsText}
          </Text>
        )}
        {testCase.driven ? null : (
          <Text
            span
            data-testid={ids.undriven}
            fz="xs"
            fw={600}
            c={caseSetStatics.undrivenColour}
            title={caseSetStatics.undrivenExplanation}
          >
            {caseSetStatics.undrivenMarker}
          </Text>
        )}
      </Group>
      {compact ? null : (
      <Text
        data-testid="CASE_RETURN"
        ff="monospace"
        fz="xs"
        c={grayed || (active && !isMatch) ? 'dark.3' : 'gray.5'}
        style={{
          backgroundColor: !grayed && isMatch ? 'var(--mantine-color-blue-9)' : undefined,
          borderRadius: 2,
          paddingInline: 4,
          whiteSpace: 'pre-wrap',
        }}
      >
        {`  => ${exit?.line ?? '?'}: ${returnValue}`}
      </Text>
      )}
      {/* WHY it did not pass, on the row itself. Without this the tab shows that a case
          failed and never what went wrong, so the reason lives only in the run console —
          a panel that opens on Run, can be dismissed, and is empty for a run someone did
          in a terminal. A case that threw is exactly the one a reader must not have to
          re-run to understand. */}
      {settled && !compact ? (
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
});
