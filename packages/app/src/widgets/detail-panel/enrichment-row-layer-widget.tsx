/**
 * PURPOSE: One line of the Enrichment tab — a source line's symbol, its type, and the representative
 *   value range for a branch operand. The row highlights when it sits on the hovered line and dims when
 *   another line is hovered.
 *
 * USAGE:
 * <EnrichmentRowLayerWidget row={row} hoveredLine={hoveredLine} />
 * // Renders `L<line>  <symbol>: <type>` with an optional `→ { values }` suffix
 */
import type { ReactElement } from '#gateway/npm/react';
import { Text } from '#gateway/npm/mantine__core';
import type { FileAnalysis } from '@assayer/shared/contracts';

export interface EnrichmentRowLayerWidgetProps {
  row: FileAnalysis['enrichment'][number];
  hoveredLine?: number | null | undefined;
}

export const EnrichmentRowLayerWidget = ({ row, hoveredLine }: EnrichmentRowLayerWidgetProps): ReactElement => {
  const active = hoveredLine !== undefined && hoveredLine !== null;
  const isMatch = active && row.line === hoveredLine;

  return (
    <Text
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
};
