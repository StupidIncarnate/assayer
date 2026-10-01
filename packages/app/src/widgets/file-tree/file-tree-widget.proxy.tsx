import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

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
