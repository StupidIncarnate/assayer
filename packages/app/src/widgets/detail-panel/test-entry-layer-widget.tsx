/**
 * PURPOSE: One entry of the Tests tab — its title (label, parameter list when it is a plain named
 *   function, and the full case count) over one TestCaseLayerWidget per derived case. It decides what
 *   the runner CALLS for the entry, which is not always the entry itself, and hands that to each case.
 *
 * USAGE:
 * <TestEntryLayerWidget fn={fn} relPath={relPath} hoveredLine={hoveredLine} run={run} runMode={runMode} />
 * // Renders `<label>(<params>) · N cases` and the case rows beneath it
 */
import { memo } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import { Box, Stack, Text } from '#gateway/npm/mantine__core';
import type { FunctionAnalysis, RunResult } from '@assayer/shared/contracts';
import { arrangeTextTransformer, moduleEntryLabelTransformer } from '@assayer/shared/transformers';

import type { RunMode } from '../../contracts/status-view/status-view-contract';
import { TestCaseLayerWidget } from './test-case-layer-widget';

export interface TestEntryLayerWidgetProps {
  fn: FunctionAnalysis;
  relPath?: string | null | undefined;
  hoveredLine?: number | null | undefined;
  run?: RunResult | undefined;
  runMode?: RunMode | undefined;
}

export const TestEntryLayerWidget = memo(
  ({
    fn,
    relPath,
    hoveredLine,
    run,
    runMode,
  }: TestEntryLayerWidgetProps): ReactElement => {
  // A module entry is reached by IMPORTING it, not calling it, so it shows a bare LABEL
  // (its single exported binding, else the file basename) with no `()` — never the
  // internal `*module*`. An ANONYMOUS entry carries its own label — the callsite that
  // reaches it, signature included — because its `name` is a structural projection, a
  // cache key no surface may print. A named function/method keeps `name(params)`.
  const isModule = fn.entry.access.kind === 'module';
  const entryLabel =
    isModule && relPath !== undefined && relPath !== null
      ? moduleEntryLabelTransformer({
            ...(fn.entry.exportName === undefined ? {} : { exportName: fn.entry.exportName }),
            relPath,
          })
      : String(fn.entry.label ?? fn.entry.exportName ?? fn.entry.name);
  // Only a name needs its parameter list appended; a label already carries the whole
  // signature, and a module takes no arguments at all.
  const showsParams = !isModule && fn.entry.label === undefined;
  // WHAT THE RUNNER CALLS, which is not always the entry. A through-caller entry — a
  // private, or a callback its host maps — is never called directly: the runner calls the
  // CALLER with the arrange and the probe observes this entry's exits. The arrange values
  // are therefore the caller's arguments, so printing them beside this entry's name
  // describes a call that never happens (`(n) => …([101])`, a one-param arrow taking an
  // array). The exit line below already says which entry was reached.
  const driver = fn.entry.access.kind === 'through-caller' ? String(fn.entry.access.callerName) : entryLabel;

  return (
    <Box data-testid="TEST_ENTRY">
      <Text ff="monospace" fz="xs" fw={600} c="gray.1">
        {showsParams
          ? `${entryLabel}(${fn.entry.params.map((param) => param.name).join(', ')}) · ${fn.cases.length} cases`
          : `${entryLabel} · ${fn.cases.length} cases`}
      </Text>
      <Stack gap={2} mt={4}>
        {fn.cases.map((testCase) => (
          <TestCaseLayerWidget
            key={`${testCase.reachesPath.join('>')}#${arrangeTextTransformer({ arrange: testCase.arrange })}`}
            fn={fn}
            testCase={testCase}
            driver={driver}
            entryLabel={entryLabel}
            isModule={isModule}
            hoveredLine={hoveredLine}
            run={run}
            runMode={runMode}
          />
        ))}
      </Stack>
    </Box>
  );
});
