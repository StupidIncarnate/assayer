/**
 * PURPOSE: The detail-view right panel — three tabs over a file's derived analysis. The Enrichment
 *   tab lists per-line data facts (symbol, type, and the representative value range for branch
 *   operands); the Tests tab lists, per entry, the FULL input-bucket set of test cases Assayer would
 *   generate (arrange values in, the exit each reaches) — every salient case carrying an INTELLIGENT
 *   badge marking the execution subset; the Contracts tab is a DevTools-style inspector of the type
 *   contracts at the file's edges (below). When a code line is hovered (hoveredLine), the rows whose
 *   coverage runs through that line are highlighted and the rest are dimmed, so the gutter counts
 *   read as "these cases". Pure prop-driven; shows empty prompts when nothing is derived.
 *
 *   An entry is named by its LABEL, never by its internal `name`: a name is a coverage-ID segment, so a
 *   module scope's is `*module*` and an anonymous callback's is its whole structural projection. Both
 *   are cache keys, and a panel that printed one would be showing the reader a key. A module reads by
 *   its single export or the file; an anonymous scope by the callsite that reaches it
 *   (`rescale › items.map((n) => …) L2`), which carries its signature already and so takes no appended
 *   parameter list.
 *
 *   A case row names WHAT THE RUNNER CALLS, which is not always the entry the row sits under. A
 *   through-caller entry is never called directly — the runner calls the caller with the arrange and the
 *   probe observes this entry's exits — so the arrange values are the CALLER's arguments and the row
 *   names the caller. Printing them beside the entry describes a call that never happens, which is the
 *   same lie `arrangeTextTransformer` refuses when it declines to render a module case as `*module*("6")`.
 *
 *   `runMode` is a display-only lens over that same full set: `intelligent` grays the non-salient
 *   breadth (each grayed row marked `data-running="false"`) so a reviewer reads only the salient
 *   subset, while `thorough` — the default, and any runMode the panel is not told — shows every row
 *   live. It never changes which cases exist or which the run engine executes; the entry title keeps
 *   the FULL count.
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
 *   All four are worded exactly as `assayer unit` prints them — `<MARKER> <subject> — <text>`, one
 *   space after the marker, the report's own line minus its two-space indent. Two surfaces over one
 *   artifact that describe it differently are two artifacts to the reader, so the claim is CHECKED
 *   rather than stated: `run-console.e2e.ts` reads the GAP rows off this panel and off the real CLI
 *   report in the run console and asserts they are the same bytes.
 *
 *   Dark spots and undriven entries read from the ANALYSIS rather than a run, and sit outside the
 *   has-entries branch. Both are facts about the FILE that running neither establishes nor changes, so
 *   opening it is enough to see them — and each is exactly what a file with NO entries can be made of,
 *   so a gated block would answer "No entries in this file" and nothing else.
 *
 *   Gaps read from the analysis too until a run exists, then from the run — the one channel where the
 *   run says MORE than the file. An input Assayer cannot construct is a fact about the file and shows
 *   on open; an entry the runner cannot reach through its access is added by the case-set projection,
 *   so it arrives with the first run. Reading both at once would print the file's half twice.
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

import { darkSpotLineTransformer } from '../../transformers/dark-spot-line/dark-spot-line-transformer';
import { drivenFunctionsTransformer } from '../../transformers/driven-functions/driven-functions-transformer';
import { undrivenLineTransformer } from '../../transformers/undriven-line/undriven-line-transformer';
import type { RunMode } from '../../contracts/status-view/status-view-contract';
import { ContractEntryLayerWidget } from './contract-entry-layer-widget';
import { EnrichmentRowLayerWidget } from './enrichment-row-layer-widget';
import { TestEntryLayerWidget } from './test-entry-layer-widget';

export interface DetailPanelWidgetProps {
  analysis: FileAnalysis | undefined;
  hoveredLine?: LineNumber | null;
  run?: RunResult | undefined;
  running?: boolean;
  runError?: Error | null;
  resolvedEdges?: readonly ResolvedEdge[] | undefined;
  relPath?: RelPath | null;
  runMode?: RunMode;
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
  runMode,
  onRun,
}: DetailPanelWidgetProps): ReactElement => {
  const enrichment = analysis === undefined ? [] : analysis.enrichment;
  // The gap channel has two producers and the run carries BOTH — the file's own input gaps plus the
  // access-shaped ones `case-set-projection` adds — so a run supersedes the analysis rather than
  // duplicating it. With no run, the analysis half still shows: an input Assayer cannot construct is
  // true the moment the file is opened, and making the reader click Run to learn it is the
  // reads-as-complete lie with an extra step.
  const gaps = run === undefined ? (analysis === undefined ? [] : analysis.gaps) : run.gaps;
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
              {enrichment.map((row) => (
                <EnrichmentRowLayerWidget key={`${row.line}:${row.symbol}`} row={row} hoveredLine={hoveredLine} />
              ))}
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

              {functions.map((fn) => (
                <TestEntryLayerWidget
                  key={fn.entry.name}
                  fn={fn}
                  relPath={relPath}
                  hoveredLine={hoveredLine}
                  run={run}
                  runMode={runMode}
                />
              ))}
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
              {edges.map((edge) => (
                <ContractEntryLayerWidget key={`${String(edge.line)}:${String(edge.column)}`} edge={edge} />
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};
