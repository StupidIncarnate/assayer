/**
 * PURPOSE: One case row of the Tests tab — its run status marker, what the runner calls with which
 *   arrange values, the exit line and return value, the INTELLIGENT badge on a salient case, and
 *   under a case the run did not pass, WHY it did not. The row dims when another line is hovered or
 *   when runMode is `intelligent` and the case is not salient.
 *
 * USAGE:
 * <TestCaseLayerWidget fn={fn} testCase={testCase} driver={driver} entryLabel={entryLabel} isModule={false} />
 * // Renders `<marker> <driver>(<arrange>)` over `  => <line>: <returnValue>`
 */
import { memo, useMemo, useState } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import { ActionIcon, Box, Group, Popover, Text } from '#gateway/npm/mantine__core';
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
  onLineHover?: ((line: number | null) => void) | undefined;
  run?: RunResult | undefined;
  runMode?: RunMode | undefined;
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
  runMode,
}: TestCaseLayerWidgetProps): ReactElement => {
  const [opened, setOpened] = useState(false);
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
      }),
    [fn, testCase.reachesPath],
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
  // Display-only: under 'intelligent' the non-salient breadth grays out; 'thorough'
  // (the default, and any runMode the panel is not told) leaves every row live. This
  // never changes what the run engine executes — only how a reviewer reads the set.
  const grayed = runMode === 'intelligent' && !testCase.salient;

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
        {/* The salient (must-run) marker — its own inline span like CASE_STATUS, but a
            SIBLING of the row so it never enters the row's asserted text. It rides every
            salient row regardless of runMode; a non-salient row shows none. */}
        {testCase.salient ? (
          <Group gap={4} wrap="nowrap" align="center">
            <Text span data-testid="INTELLIGENT_BADGE" fz="xs" fw={600} c={runModeStatics.colour.intelligent}>
              {runModeStatics.marker.intelligent}
            </Text>
            <Popover
              width={320}
              position="bottom-start"
              withArrow
              shadow="md"
              withinPortal={false}
              transitionProps={{ duration: 0 }}
              opened={opened}
              onChange={setOpened}
            >
              <Popover.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="xs"
                  aria-label="Explain intelligent badge"
                  data-testid="INTELLIGENT_INFO_ICON"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpened((prev) => !prev);
                  }}
                >
                  <Text span fz="xs" c="dimmed">
                    ⓘ
                  </Text>
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown
                data-testid="INTELLIGENT_EXPLANATION"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <Text fz="xs">{runModeStatics.explanation.intelligent}</Text>
              </Popover.Dropdown>
            </Popover>
          </Group>
        ) : null}
      </Group>
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
});
