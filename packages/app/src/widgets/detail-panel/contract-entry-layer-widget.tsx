/**
 * PURPOSE: One resolved import or ambient global on the Contracts tab, drawn as a DevTools-style
 *   inspector entry — the symbol and its source, then the structured INPUT contract (one `name: type`
 *   line per param, `—` when there are none), then the OUTPUT line. Teal, distinct from the admissions
 *   on the Tests tab.
 *
 * USAGE:
 * <ContractEntryLayerWidget edge={edge} />
 * // Renders CONTRACT_SYMBOL, CONTRACT_SOURCE, CONTRACT_INPUT lines and an optional CONTRACT_OUTPUT
 */
import type { ReactElement } from '#gateway/npm/react';
import { Box, Stack, Text } from '#gateway/npm/mantine__core';
import type { ResolvedEdge } from '@assayer/shared/contracts';

import { resolvedEdgeContractTransformer } from '../../transformers/resolved-edge-contract/resolved-edge-contract-transformer';

export interface ContractEntryLayerWidgetProps {
  edge: ResolvedEdge;
}

export const ContractEntryLayerWidget = ({ edge }: ContractEntryLayerWidgetProps): ReactElement => {
  const view = resolvedEdgeContractTransformer({ edge });

  return (
    <Box data-testid="CONTRACT_ENTRY">
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
};
