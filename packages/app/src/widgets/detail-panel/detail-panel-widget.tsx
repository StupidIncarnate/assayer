/**
 * PURPOSE: The detail-view right panel — two tabs over a file's derived analysis. The Enrichment
 *   tab lists per-line data facts (symbol, type, and the representative value range for branch
 *   operands); the Tests tab lists, per entry, the salient test cases Assayer would generate (arrange
 *   values in, the exit each reaches). When a code line is hovered (hoveredLine), the rows whose
 *   coverage runs through that line are highlighted and the rest are dimmed, so the gutter counts
 *   read as "these cases". Pure prop-driven; shows empty prompts when nothing is derived.
 *
 * USAGE:
 * <DetailPanelWidget analysis={fileView.analysis} hoveredLine={hoveredLine} />
 * // Renders the Enrichment / Tests tabbed panel, highlighting rows tied to the hovered line
 */
import type { ReactElement } from 'react';
import { Box, Tabs, Text, Stack } from '@mantine/core';
import type { FileAnalysis, LineNumber } from '@assayer/shared/contracts';

import { caseTouchedLinesTransformer } from '../../transformers/case-touched-lines/case-touched-lines-transformer';

export interface DetailPanelWidgetProps {
  analysis: FileAnalysis | undefined;
  hoveredLine?: LineNumber | null;
}

export const DetailPanelWidget = ({ analysis, hoveredLine }: DetailPanelWidgetProps): ReactElement => {
  const functions = analysis === undefined ? [] : analysis.functions;
  const enrichment = analysis === undefined ? [] : analysis.enrichment;
  const active = hoveredLine !== undefined && hoveredLine !== null;

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
          {functions.length === 0 ? (
            <Text data-testid="TESTS_EMPTY" c="dimmed" fz="sm">
              No entries in this file
            </Text>
          ) : (
            <Stack gap="sm">
              <Text data-testid="TESTS_HINT" c="dimmed" fz="xs" fs="italic">
                Hover a line in the code to highlight the cases that run through it.
              </Text>
              {functions.map((fn) => (
                <Box key={fn.entry.name} data-testid="TEST_ENTRY">
                  <Text ff="monospace" fz="xs" fw={600} c="gray.1">
                    {`${fn.entry.name}(${fn.entry.params.map((param) => param.name).join(', ')}) · ${fn.cases.length} cases`}
                  </Text>
                  <Stack gap={2} mt={4}>
                    {fn.cases.map((testCase) => {
                      const exit = fn.exits.find((candidate) => candidate.coverageId === testCase.reachesExit);
                      const touched = caseTouchedLinesTransformer({
                        functionAnalysis: fn,
                        reachesExit: testCase.reachesExit,
                      });
                      const isMatch = active && touched.some((line) => line === hoveredLine);
                      return (
                        <Text
                          key={testCase.reachesExit}
                          data-testid="TEST_CASE_ROW"
                          data-match={isMatch ? 'true' : 'false'}
                          ff="monospace"
                          fz="xs"
                          c={active && !isMatch ? 'dark.3' : 'gray.4'}
                          style={{
                            backgroundColor: isMatch ? 'var(--mantine-color-blue-9)' : undefined,
                            borderRadius: 2,
                            paddingInline: 4,
                          }}
                        >
                          {`${fn.entry.name}(${testCase.arrange
                            .map((binding) => JSON.stringify(binding.value))
                            .join(', ')}) → reaches L${exit?.line ?? '?'}`}
                        </Text>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};
