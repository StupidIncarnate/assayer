/**
 * PURPOSE: Renders the compiled-surface summary header line — 'Assayer | <root> <repo>/<branch> | ts N tsx M'
 *   — from the CompiledTree summary. Pure prop-driven; no data fetching.
 *
 * USAGE:
 * <ExplorerHeaderWidget summary={tree.summary} />
 * // Renders the explorer top-bar header text
 */
import type { ReactElement } from 'react';
import { Text } from '@mantine/core';
import type { CompiledTree } from '@assayer/shared/contracts';

export interface ExplorerHeaderWidgetProps {
  summary: CompiledTree['summary'];
}

export const ExplorerHeaderWidget = ({ summary }: ExplorerHeaderWidgetProps): ReactElement => (
  <Text data-testid="EXPLORER_HEADER">
    {`Assayer | ${summary.rootFolderName} ${summary.repoName}/${summary.branchName} | ts ${summary.tsCount} tsx ${summary.tsxCount}`}
  </Text>
);
