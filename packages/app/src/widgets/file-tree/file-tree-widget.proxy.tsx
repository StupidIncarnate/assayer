import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FileTreeNodeLayerWidgetProxy } from './file-tree-node-layer-widget.proxy';

export const FileTreeWidgetProxy = (): {
  clickEntry: (params: { label: string }) => Promise<void>;
} => {
  FileTreeNodeLayerWidgetProxy();

  return {
    clickEntry: async ({ label }: { label: string }): Promise<void> => {
      await userEvent.click(screen.getByText(label));
    },
  };
};
