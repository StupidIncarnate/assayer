/**
 * PURPOSE: One entry of the Tests tab — its title (label, parameter list when it is a plain named
 *   function, and the every-route case count) over its two labelled case sets, each one
 *   TestCaseLayerWidget per case: "Every route" (one case per route that can actually run) and
 *   "Fewest runs" (the smallest subset taking every reachable arm, the set Assayer runs). It decides what
 *   the runner CALLS for the entry, which is not always the entry itself, and hands that to each case.
 *
 * USAGE:
 * <TestEntryLayerWidget fn={fn} relPath={relPath} hoveredLine={hoveredLine} run={run} />
 * // Renders `<label>(<params>) · N cases`, then the Every route and Fewest runs sets beneath it
 */
import { memo } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import { Box, Text } from '#gateway/npm/mantine__core';
import type { FunctionAnalysis, RunResult } from '@assayer/shared/contracts';
import { moduleEntryLabelTransformer } from '@assayer/shared/transformers';

import { CaseSetLayerWidget } from './case-set-layer-widget';

export interface TestEntryLayerWidgetProps {
  fn: FunctionAnalysis;
  relPath?: string | null | undefined;
  hoveredLine?: number | null | undefined;
  onLineHover?: ((line: number | null) => void) | undefined;
  run?: RunResult | undefined;
}

export const TestEntryLayerWidget = memo(
  ({
    fn,
    relPath,
    hoveredLine,
    onLineHover,
    run,
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
      <CaseSetLayerWidget
        set="every-route"
        cases={fn.cases}
        fn={fn}
        driver={driver}
        entryLabel={entryLabel}
        isModule={isModule}
        hoveredLine={hoveredLine}
        onLineHover={onLineHover}
        run={run}
      />
      <CaseSetLayerWidget
        set="fewest-runs"
        cases={fn.cases.filter((testCase) => testCase.fewestRuns)}
        fn={fn}
        driver={driver}
        entryLabel={entryLabel}
        isModule={isModule}
        hoveredLine={hoveredLine}
        onLineHover={onLineHover}
        run={run}
      />
    </Box>
  );
});
