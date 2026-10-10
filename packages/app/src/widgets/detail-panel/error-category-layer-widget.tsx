/**
 * PURPOSE: One category of admissions/errors on the Tests tab (undriven, lints, darkSpots, gaps).
 *   Renders the group header with title and count, an info icon popover explaining the category concisely,
 *   and the error items styled in dark red with line numbers, highlighting on hover.
 *
 * USAGE:
 * <ErrorCategoryLayerWidget category="undriven" items={undriven} hoveredLine={hoveredLine} onLineHover={onLineHover} />
 * // Renders `Undriven Errors · 1`, the ⓘ popover, and the item rows
 */
import { useMemo, useState } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import { ActionIcon, Box, Group, Popover, Stack, Text } from '#gateway/npm/mantine__core';
import type { DarkSpot, EntryGap, FileAnalysis, LintEntry, UndrivenEntry } from '@assayer/shared/contracts';

import { errorCategoryStatics } from '../../statics/error-category/error-category-statics';

export type ErrorCategory = 'undriven' | 'lints' | 'darkSpots' | 'gaps';

export interface ErrorCategoryLayerWidgetProps {
  category: ErrorCategory;
  items: readonly (UndrivenEntry | LintEntry | DarkSpot | EntryGap)[];
  hoveredLine?: number | null | undefined;
  onLineHover?: ((line: number | null) => void) | undefined;
  analysis?: FileAnalysis | undefined;
}

export const ErrorCategoryLayerWidget = ({
  category,
  items,
  hoveredLine,
  onLineHover,
  analysis,
}: ErrorCategoryLayerWidgetProps): ReactElement => {
  const [opened, setOpened] = useState(false);
  const title = errorCategoryStatics.title[category];
  const explanation = errorCategoryStatics.explanation[category];

  const gapLines = useMemo(() => {
    const map = new Map<string, number>();
    for (const fn of analysis?.functions ?? []) {
      map.set(fn.entry.name, Number(fn.entry.line));
    }
    return map;
  }, [analysis]);

  if (items.length === 0) {
    return <Box display="none" />;
  }

  return (
    <Box mb="xs" data-testid={`ERROR_GROUP_${category.toUpperCase()}`}>
      <Group gap={6} wrap="nowrap" align="center" mb={4}>
        <Text ff="monospace" fz="xs" fw={600} c="gray.1" data-testid={`ERROR_GROUP_TITLE_${category.toUpperCase()}`}>
          {`${title} · ${items.length}`}
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
              aria-label={`Explain ${title}`}
              data-testid={`ERROR_INFO_ICON_${category.toUpperCase()}`}
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
            data-testid={`ERROR_EXPLANATION_${category.toUpperCase()}`}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Text fz="xs">{explanation}</Text>
          </Popover.Dropdown>
        </Popover>
      </Group>

      <Stack gap={2}>
        {category === 'undriven'
          ? (items as readonly UndrivenEntry[]).map((entry, index) => (
              <Text
                key={`${category}:${index}:${String(entry.name)}:${String(entry.startLine)}`}
                data-testid="UNDRIVEN"
                c={errorCategoryStatics.colour}
                fz="xs"
                ff="monospace"
                onMouseEnter={() => {
                  onLineHover?.(Number(entry.startLine));
                }}
                onMouseLeave={() => {
                  onLineHover?.(null);
                }}
                style={{
                  backgroundColor:
                    hoveredLine !== null &&
                    hoveredLine !== undefined &&
                    hoveredLine >= Number(entry.startLine) &&
                    hoveredLine <= Number(entry.endLine)
                      ? 'var(--mantine-color-blue-9)'
                      : undefined,
                  borderRadius: 2,
                  paddingInline: 4,
                  cursor: 'pointer',
                }}
              >
                {`L${Number(entry.startLine)}: ${String(entry.label ?? entry.name)}`}
              </Text>
            ))
          : null}

        {category === 'lints'
          ? (items as readonly LintEntry[]).map((lint, index) => (
              <Text
                key={`${category}:${index}:${String(lint.name)}:${String(lint.startLine)}`}
                data-testid="LINT"
                c={errorCategoryStatics.colour}
                fz="xs"
                ff="monospace"
                onMouseEnter={() => {
                  onLineHover?.(Number(lint.startLine));
                }}
                onMouseLeave={() => {
                  onLineHover?.(null);
                }}
                style={{
                  backgroundColor:
                    hoveredLine !== null &&
                    hoveredLine !== undefined &&
                    hoveredLine >= Number(lint.startLine) &&
                    hoveredLine <= Number(lint.endLine)
                      ? 'var(--mantine-color-blue-9)'
                      : undefined,
                  borderRadius: 2,
                  paddingInline: 4,
                  cursor: 'pointer',
                }}
              >
                {`L${Number(lint.startLine)}: ${String(lint.name)} — ${String(lint.message)}`}
              </Text>
            ))
          : null}

        {category === 'darkSpots'
          ? (items as readonly DarkSpot[]).map((darkSpot) => (
              <Text
                key={`${String(darkSpot.kind)}:${String(darkSpot.startLine)}-${String(darkSpot.endLine)}:${darkSpot.scopePath
                  .map((segment) => String(segment))
                  .join('/')}`}
                data-testid="DARK_SPOT"
                c={errorCategoryStatics.colour}
                fz="xs"
                ff="monospace"
                onMouseEnter={() => {
                  onLineHover?.(Number(darkSpot.startLine));
                }}
                onMouseLeave={() => {
                  onLineHover?.(null);
                }}
                style={{
                  backgroundColor:
                    hoveredLine !== null &&
                    hoveredLine !== undefined &&
                    hoveredLine >= Number(darkSpot.startLine) &&
                    hoveredLine <= Number(darkSpot.endLine)
                      ? 'var(--mantine-color-blue-9)'
                      : undefined,
                  borderRadius: 2,
                  paddingInline: 4,
                  cursor: 'pointer',
                }}
              >
                {`L${Number(darkSpot.startLine)}: ${String(darkSpot.kind)}`}
              </Text>
            ))
          : null}

        {category === 'gaps'
          ? (items as readonly EntryGap[]).map((gap, index) => (
              <Text
                key={`${category}:${index}:${String(gap.name)}`}
                data-testid="RUN_GAP"
                c={errorCategoryStatics.colour}
                fz="xs"
                ff="monospace"
                onMouseEnter={() => {
                  const line = gapLines.get(gap.name);
                  if (line !== undefined) {
                    onLineHover?.(line);
                  }
                }}
                onMouseLeave={() => {
                  onLineHover?.(null);
                }}
                style={{
                  backgroundColor:
                    gapLines.has(gap.name) && hoveredLine === gapLines.get(gap.name)
                      ? 'var(--mantine-color-blue-9)'
                      : undefined,
                  borderRadius: 2,
                  paddingInline: 4,
                  cursor: gapLines.has(gap.name) ? 'pointer' : undefined,
                }}
              >
                {`${String(gap.name)} — ${String(gap.reason)}`}
              </Text>
            ))
          : null}
      </Stack>
    </Box>
  );
};
