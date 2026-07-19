/**
 * PURPOSE: The detail-view right panel — three tabs over a file's derived analysis. The Enrichment
 *   tab lists per-line data facts (symbol, type, and the representative value range for branch
 *   operands); the Tests tab lists, per entry, the salient test cases Assayer would generate (arrange
 *   values in, the exit each reaches); the Contracts tab is a DevTools-style inspector of the type
 *   contracts at the file's edges (below). When a code line is hovered (hoveredLine), the rows whose
 *   coverage runs through that line are highlighted and the rest are dimmed, so the gutter counts
 *   read as "these cases". Pure prop-driven; shows empty prompts when nothing is derived.
 *
 *   This panel is the SINGLE surface that shows a run error (`runError`), and no other may repeat it.
 *   It owns the error because it is the only one on screen for every failure: `useFileRunBinding`
 *   raises `error` both when a saved run fails to LOAD (on opening a file) and when a run fails to
 *   EXECUTE, while the run console opens only on Run and can be dismissed. A verdict the reader can
 *   close away, leaving the case rows reading "not run", is the reads-as-complete lie the panel exists
 *   to prevent.
 *
 *   Four admissions ride beside the cases, each answering "who owes this work?" differently, each on
 *   its own row, and never merged — merged, every one of them would order the reader to do something
 *   nobody can do:
 *   - a GAP is the READER's debt — understood, not constructable, so a harness closes it;
 *   - a DARK SPOT is ASSAYER's — syntax it never parsed, which no harness closes and no feature is
 *     promised for;
 *   - an UNDRIVEN entry is read perfectly and merely out of the runner's reach — no harness closes it
 *     either, but a named feature would, so its wording must never read as permanent.
 *   - a LINT is the REPO's debt — a pattern to change (a private nothing consumes), which is why,
 *     alone among the four, it can fail the build.
 *   All four are worded exactly as `assayer unit` prints them; two surfaces over one artifact that
 *   describe it differently are two artifacts to the reader.
 *
 *   Dark spots and undriven entries read from the ANALYSIS rather than a run, and sit outside the
 *   has-entries branch. Both are facts about the FILE that running neither establishes nor changes, so
 *   opening it is enough to see them — and each is exactly what a file with NO entries can be made of,
 *   so a gated block would answer "No entries in this file" and nothing else.
 *
 *   An undriven entry's derived cases are not listed. They exist in the analysis and nothing will ever
 *   execute them, so listing them would advertise pending tests while the run beside them reports 0/0.
 *   `drivenFunctionsTransformer` owns that narrowing; the code viewer's gutter reads through the same
 *   one, so neither surface counts a case the other cannot.
 *
 *   The cross-file imports and ambient globals the file uses (`resolvedEdges`, already scoped to this
 *   file — each edge's `from` IS this path) live in their OWN dedicated Contracts tab, never mixed in
 *   with the admissions: if the app rendered the file at all, its imports ARE resolved (an unresolvable
 *   one is a hard build error with no cache to open), so there is no `RESOLVED` noise to state — what
 *   is useful is the TYPE CONTRACT. Each edge renders as a DevTools-style inspector entry: the symbol,
 *   its source (`import '<path>' → <def>`, `pkg <name>`, or `global`), a structured INPUT contract
 *   (one `name: type` line per param — the star of the section, `—` when there are none), and an
 *   OUTPUT/return type line; a member-access global (`process.env`) shows its member `type` instead.
 *   Teal/positive colour, distinct from the admissions.
 *
 * USAGE:
 * <DetailPanelWidget analysis={fileView.analysis} resolvedEdges={fileView.resolvedEdges} relPath={selectedRelPath} hoveredLine={hoveredLine} runError={fileRun.error} />
 * // Renders the Enrichment / Tests / Contracts tabbed panel, highlighting rows tied to the hovered line
 */
import type { ReactElement } from 'react';
import { Box, Tabs, Text, Stack, Button, Group } from '@mantine/core';
import type { FileAnalysis, LineNumber, RelPath, ResolvedEdge, RunResult } from '@assayer/shared/contracts';
import { arrangeTextTransformer, moduleEntryLabelTransformer } from '@assayer/shared/transformers';

import { caseRunStatusTransformer } from '../../transformers/case-run-status/case-run-status-transformer';
import { caseTouchedLinesTransformer } from '../../transformers/case-touched-lines/case-touched-lines-transformer';
import { darkSpotLineTransformer } from '../../transformers/dark-spot-line/dark-spot-line-transformer';
import { drivenFunctionsTransformer } from '../../transformers/driven-functions/driven-functions-transformer';
import { resolvedEdgeContractTransformer } from '../../transformers/resolved-edge-contract/resolved-edge-contract-transformer';
import { undrivenLineTransformer } from '../../transformers/undriven-line/undriven-line-transformer';
import { runStatusStatics } from '../../statics/run-status/run-status-statics';

export interface DetailPanelWidgetProps {
  analysis: FileAnalysis | undefined;
  hoveredLine?: LineNumber | null;
  run?: RunResult | undefined;
  running?: boolean;
  runError?: Error | null;
  resolvedEdges?: readonly ResolvedEdge[] | undefined;
  relPath?: RelPath | null;
  onRun?: () => void;
}

export const DetailPanelWidget = ({
  analysis,
  hoveredLine,
  run,
  running,
  runError,
  resolvedEdges,
  relPath,
  onRun,
}: DetailPanelWidgetProps): ReactElement => {
  const enrichment = analysis === undefined ? [] : analysis.enrichment;
  const active = hoveredLine !== undefined && hoveredLine !== null;
  const gaps = run === undefined ? [] : run.gaps;
  // Both from the analysis, not the run: `case-set-projection` copies them into the run verbatim, so
  // the run's copy says nothing the file's own analysis does not already say — and says it only after
  // a click.
  const darkSpots = analysis === undefined ? [] : analysis.darkSpots;
  const undriven = analysis === undefined ? [] : analysis.undriven;
  const lints = analysis === undefined ? [] : analysis.lints;
  // The cross-file imports this file makes, already resolved to their canonical definitions by the
  // stitch pass. A positive fact about the FILE (not a run and not an admission), so it sits outside
  // the has-entries branch and shows the moment the file is opened.
  const edges = resolvedEdges ?? [];
  // The entries a run will actually drive. An undriven entry keeps its admission row above and loses
  // its case list: nothing executes those cases, so listing them would promise tests the run reports
  // as 0/0.
  const functions = drivenFunctionsTransformer({
    functions: analysis === undefined ? [] : analysis.functions,
    undriven,
  });

  return (
    <Box
      data-testid="DETAIL_PANEL"
      bg="dark.7"
      style={{ width: 360, flexShrink: 0, overflow: 'auto', borderLeft: '1px solid var(--mantine-color-dark-4)' }}
    >
      <Tabs defaultValue="tests" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="enrichment" data-testid="TAB_ENRICHMENT">
            Enrichment
          </Tabs.Tab>
          <Tabs.Tab value="tests" data-testid="TAB_TESTS">
            Tests
          </Tabs.Tab>
          <Tabs.Tab value="contracts" data-testid="TAB_CONTRACTS">
            Contracts
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="enrichment" p="sm">
          {enrichment.length === 0 ? (
            <Text data-testid="ENRICHMENT_EMPTY" c="dimmed" fz="sm">
              No enrichment for this file
            </Text>
          ) : (
            <Stack gap={4}>
              {enrichment.map((row) => {
                const isMatch = active && row.line === hoveredLine;
                return (
                  <Text
                    key={`${row.line}:${row.symbol}`}
                    data-testid="ENRICHMENT_ROW"
                    data-match={isMatch ? 'true' : 'false'}
                    ff="monospace"
                    fz="xs"
                    c={active && !isMatch ? 'dark.3' : 'gray.3'}
                    style={{
                      backgroundColor: isMatch ? 'var(--mantine-color-blue-9)' : undefined,
                      borderRadius: 2,
                      paddingInline: 4,
                    }}
                  >
                    {`L${row.line}  ${row.symbol}: ${row.typeText}${
                      row.range === undefined ? '' : `  → { ${row.range.map((value) => JSON.stringify(value)).join(', ')} }`
                    }`}
                  </Text>
                );
              })}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="tests" p="sm">
          {/* Outside the has-entries branch: a run error is about the RUN, not about what the file
              declares, so a file with nothing to drive must still be able to say why running it
              failed. */}
          {runError === null || runError === undefined ? null : (
            <Text data-testid="RUN_ERROR" c="red.4" fz="xs" ff="monospace" mb="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {runError.message}
            </Text>
          )}

          {/* Outside the has-entries branch for the same reason the run error is: a dark spot is a
              fact about the FILE, and a file whose only logic is an unfollowed loop has no entries to
              hang it off — which is exactly when staying silent reads as "nothing to test here". */}
          {darkSpots.map((darkSpot) => (
            <Text
              key={`${String(darkSpot.kind)}:${String(darkSpot.startLine)}-${String(darkSpot.endLine)}:${darkSpot.scopePath
                .map((segment) => String(segment))
                .join('/')}`}
              data-testid="DARK_SPOT"
              c="grape.4"
              fz="xs"
              ff="monospace"
              mb="xs"
            >
              {String(darkSpotLineTransformer({ darkSpot }))}
            </Text>
          ))}

          {/* Beside the dark spots and never folded into them: a dark spot is syntax Assayer never
              parsed, this is syntax it parsed perfectly and cannot yet call. Outside the has-entries
              branch because a file of pure module-scope branching has NO entries once the undriven one
              is set aside — the case where staying silent says "nothing to test here". */}
          {undriven.map((entry) => (
            <Text
              key={String(entry.name)}
              data-testid="UNDRIVEN"
              c="cyan.4"
              fz="xs"
              ff="monospace"
              mb="xs"
            >
              {String(undrivenLineTransformer({ entry }))}
            </Text>
          ))}

          {/* The fourth admission, and the only one that colours like a warning: it is the repo's to
              fix, not Assayer's to admit. Outside the has-entries branch like the other file-facts —
              a file whose only content is a dead private has no entries to hang it off. */}
          {lints.map((lint) => (
            <Text key={String(lint.name)} data-testid="LINT" c="orange.4" fz="xs" ff="monospace" mb="xs">
              {`LINT ${String(lint.name)} — ${String(lint.message)}`}
            </Text>
          ))}

          {/* An undriven entry or a lint is content, so a file that has one is never "empty" — the
              admission above IS this tab's content. */}
          {functions.length === 0 && undriven.length === 0 && lints.length === 0 ? (
            <Text data-testid="TESTS_EMPTY" c="dimmed" fz="sm">
              No entries in this file
            </Text>
          ) : (
            <Stack gap="sm">
              {/* Both controls are about driving cases, so neither appears when there are none to
                  drive: the hint would point at rows that do not exist, and Run would offer a verdict
                  the panel already states in full. Offering it anyway implies a run might reveal
                  something — the same "pending" promise the case rows no longer make. */}
              {functions.length === 0 ? null : (
                <Group justify="space-between" gap="xs">
                  <Text data-testid="TESTS_HINT" c="dimmed" fz="xs" fs="italic">
                    Hover a line to highlight its cases.
                  </Text>
                  <Button
                    data-testid="RUN_BUTTON"
                    size="compact-xs"
                    variant="light"
                    loading={running === true}
                    onClick={onRun}
                  >
                    Run
                  </Button>
                </Group>
              )}

              {gaps.map((gap) => (
                <Text key={String(gap.name)} data-testid="RUN_GAP" c="yellow.5" fz="xs" ff="monospace">
                  {`GAP ${String(gap.name)} — ${String(gap.reason)}`}
                </Text>
              ))}

              {functions.map((fn) => {
                // A module entry is reached by IMPORTING it, not calling it, so it shows a bare LABEL
                // (its single exported binding, else the file basename) with no `()` — never the
                // internal `*module*`. A function/method entry keeps `name(params)`.
                const isModule = fn.entry.access.kind === 'module';
                const entryLabel =
                  isModule && relPath !== undefined && relPath !== null
                    ? String(
                        moduleEntryLabelTransformer({
                          ...(fn.entry.exportName === undefined ? {} : { exportName: fn.entry.exportName }),
                          relPath: String(relPath),
                        }),
                      )
                    : String(fn.entry.exportName ?? fn.entry.name);

                return (
                  <Box key={fn.entry.name} data-testid="TEST_ENTRY">
                    <Text ff="monospace" fz="xs" fw={600} c="gray.1">
                      {isModule
                        ? `${entryLabel} · ${fn.cases.length} cases`
                        : `${entryLabel}(${fn.entry.params
                            .map((param) => param.name)
                            .join(', ')}) · ${fn.cases.length} cases`}
                    </Text>
                    <Stack gap={2} mt={4}>
                    {fn.cases.map((testCase) => {
                      const exit = fn.exits.find((candidate) => candidate.coverageId === testCase.reachesExit);
                      const touched = caseTouchedLinesTransformer({
                        functionAnalysis: fn,
                        reachesExit: testCase.reachesExit,
                      });
                      const isMatch = active && touched.some((line) => line === hoveredLine);
                      const status = String(caseRunStatusTransformer({ run, testCase }));

                      return (
                        <Text
                          key={`${testCase.reachesExit}#${arrangeTextTransformer({ arrange: testCase.arrange })}`}
                          data-testid="TEST_CASE_ROW"
                          data-match={isMatch ? 'true' : 'false'}
                          data-status={status}
                          ff="monospace"
                          fz="xs"
                          c={active && !isMatch ? 'dark.3' : 'gray.4'}
                          style={{
                            backgroundColor: isMatch ? 'var(--mantine-color-blue-9)' : undefined,
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
                            ? `${entryLabel} → reaches L${exit?.line ?? '?'}`
                            : `${entryLabel}(${arrangeTextTransformer({
                                arrange: testCase.arrange,
                              })}) → reaches L${exit?.line ?? '?'}`}
                        </Text>
                      );
                    })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="contracts" p="sm">
          {edges.length === 0 ? (
            <Text data-testid="CONTRACTS_EMPTY" c="dimmed" fz="sm">
              No contracts for this file
            </Text>
          ) : (
            <Stack gap="sm">
              {/* Each resolved import / ambient global as a DevTools-style inspector entry: symbol +
                  source, then the structured INPUT contract (one `name: type` per param — the star,
                  `—` when there are none), then the OUTPUT/return (or a member `type`) line. Teal /
                  positive colour, distinct from the admissions on the Tests tab. */}
              {edges.map((edge) => {
                const view = resolvedEdgeContractTransformer({ edge });

                return (
                  <Box
                    key={`${String(edge.line)}:${String(edge.column)}:${view.symbol}`}
                    data-testid="CONTRACT_ENTRY"
                  >
                    <Text data-testid="CONTRACT_SYMBOL" ff="monospace" fz="xs" fw={600} c="teal.3">
                      {view.symbol}
                    </Text>
                    <Text data-testid="CONTRACT_SOURCE" ff="monospace" fz="xs" c="teal.6">
                      {view.source}
                    </Text>
                    <Stack gap={0} mt={2} pl="xs" style={{ borderLeft: '2px solid var(--mantine-color-teal-9)' }}>
                      {view.inputs.length === 0 ? (
                        <Text data-testid="CONTRACT_INPUT" ff="monospace" fz="xs" c="teal.4">
                          —
                        </Text>
                      ) : (
                        view.inputs.map((line) => (
                          <Text key={line} data-testid="CONTRACT_INPUT" ff="monospace" fz="xs" c="teal.4">
                            {line}
                          </Text>
                        ))
                      )}
                      {view.output === undefined ? null : (
                        <Text data-testid="CONTRACT_OUTPUT" ff="monospace" fz="xs" c="teal.4">
                          {view.output}
                        </Text>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};
