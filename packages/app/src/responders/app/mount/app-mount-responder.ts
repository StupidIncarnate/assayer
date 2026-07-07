/**
 * PURPOSE: Mounts the assayer renderer's app tree into the #root DOM element via the react-dom
 *   mount adapter. The single boundary responder the startup flow calls.
 *
 * USAGE:
 * AppMountResponder({ content: <AppFlow /> });
 * // Returns { success: true } after mounting; throws if #root is missing
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { reactDomMountAdapter } from '../../../adapters/react-dom/mount/react-dom-mount-adapter';

export const AppMountResponder = ({ content }: { content: React.JSX.Element }): AdapterResult => {
  const container = document.getElementById('root');

  if (container === null) {
    throw new Error('Root container "#root" not found');
  }

  return reactDomMountAdapter({ container, content });
};
