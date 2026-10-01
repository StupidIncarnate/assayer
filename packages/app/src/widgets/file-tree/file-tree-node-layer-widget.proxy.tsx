import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

export const FileTreeNodeLayerWidgetProxy = (): {
  clickEntry: (params: { label: string }) => Promise<void>;
} => ({
  clickEntry: async ({ label }: { label: string }): Promise<void> => {
    await userEvent.click(screen.getByText(label));
  },
});
