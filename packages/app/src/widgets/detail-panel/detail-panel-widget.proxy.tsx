import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const DetailPanelWidgetProxy = (): {
  openContractsTab: () => Promise<void>;
} => ({
  openContractsTab: async (): Promise<void> => {
    await userEvent.click(screen.getByTestId('TAB_CONTRACTS'));
  },
});
