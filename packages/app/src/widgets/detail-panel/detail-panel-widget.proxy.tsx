import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import { ContractEntryLayerWidgetProxy } from './contract-entry-layer-widget.proxy';
import { EnrichmentRowLayerWidgetProxy } from './enrichment-row-layer-widget.proxy';
import { TestEntryLayerWidgetProxy } from './test-entry-layer-widget.proxy';

export const DetailPanelWidgetProxy = (): {
  openContractsTab: () => Promise<void>;
} => {
  ContractEntryLayerWidgetProxy();
  EnrichmentRowLayerWidgetProxy();
  TestEntryLayerWidgetProxy();

  return {
    openContractsTab: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('TAB_CONTRACTS'));
    },
  };
};
