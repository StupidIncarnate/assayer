import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const FileTreeNodeLayerWidgetProxy = (): {
  clickEntry: (params: { label: string }) => Promise<void>;
} => ({
  clickEntry: async ({ label }: { label: string }): Promise<void> => {
    await userEvent.click(screen.getByText(label));
  },
});
