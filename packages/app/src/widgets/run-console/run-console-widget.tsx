/**
 * PURPOSE: The run console — a dismissable full-height column at the right of the explorer, showing
 *   the assayer CLI's output for the run in flight, verbatim and as it is written.
 *
 *   It shows the CLI's OWN text rather than a re-rendering of the run artifact. The panel and a human
 *   typing `assayer unit` must never be able to disagree about what happened, and the only way to
 *   guarantee that is to show the same bytes rather than a second telling of them.
 *
 *   It states the run's END explicitly ("Running…" vs the exit line) because a report that merely
 *   stops writing cannot be told apart from one still being written — which is exactly the
 *   spinning-forever failure this panel exists to make impossible.
 *
 *   It takes `failed` and not the Error: a run that could not happen produced no CLI bytes to show,
 *   and its reason belongs to the detail panel, which is on screen for every failure this console is
 *   not (it opens only on Run and can be dismissed). Holding a boolean rather than the message is what
 *   keeps the one error from being printed on two surfaces.
 *
 * USAGE:
 * <RunConsoleWidget output={output} running={running} failed={runError !== null} onHide={hide} />
 * // Renders the CLI's report; the caller decides when the panel is mounted
 */
import type { ReactElement } from 'react';
import { Box, Group, Text, CloseButton, ScrollArea } from '@mantine/core';

import { runConsoleStatics } from '../../statics/run-console/run-console-statics';
import { runConsoleStatusTransformer } from '../../transformers/run-console-status/run-console-status-transformer';
import type { RunConsole } from '../../contracts/run-console/run-console-contract';

const PANEL_WIDTH = 380;

export const RunConsoleWidget = ({
  output,
  running,
  failed = false,
  onHide,
}: {
  output: RunConsole;
  running: boolean;
  failed?: boolean;
  onHide: () => void;
}): ReactElement => {
  const status = String(runConsoleStatusTransformer({ running, failed }));

  return (
    <Box
      data-testid="RUN_CONSOLE"
      bg="dark.9"
      style={{
        width: PANEL_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--mantine-color-dark-4)',
      }}
    >
      <Group
        justify="space-between"
        gap="xs"
        px="sm"
        py={4}
        bg="dark.7"
        style={{ flexShrink: 0, borderBottom: '1px solid var(--mantine-color-dark-4)' }}
      >
        <Text
          data-testid="RUN_CONSOLE_STATUS"
          fz="xs"
          fw={600}
          c={runConsoleStatics.statusColour[status as keyof typeof runConsoleStatics.statusColour]}
        >
          {runConsoleStatics.status[status as keyof typeof runConsoleStatics.status]}
        </Text>
        <CloseButton data-testid="RUN_CONSOLE_HIDE" size="sm" onClick={onHide} aria-label="Hide the run console" />
      </Group>

      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
        {String(output) === '' ? (
          <Text data-testid="RUN_CONSOLE_EMPTY" c="dimmed" fz="xs" p="sm">
            {failed ? runConsoleStatics.noOutputMessage : runConsoleStatics.waitingMessage}
          </Text>
        ) : (
          <Text
            data-testid="RUN_CONSOLE_OUTPUT"
            component="pre"
            c="gray.4"
            fz="xs"
            ff="monospace"
            p="sm"
            m={0}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {String(output)}
          </Text>
        )}
      </ScrollArea>
    </Box>
  );
};
