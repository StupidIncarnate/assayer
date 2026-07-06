/**
 * PURPOSE: Mounts the assayer renderer — builds the root router widget element and mounts it
 *   into #root via the react-dom mount adapter. The single boundary responder startup calls.
 *
 * USAGE:
 * AppMountResponder();
 * // Returns { success: true } after mounting; throws if #root is missing
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { reactDomMountAdapter } from '../../../adapters/react-dom/mount/react-dom-mount-adapter';
import { AppRouterWidget } from '../../../widgets/app-router/app-router-widget';

export const AppMountResponder = (): AdapterResult => {
  const container = document.getElementById('root');

  if (container === null) {
    throw new Error('Root container "#root" not found');
  }

  return reactDomMountAdapter({
    container,
    content: reactCreateElementAdapter({ component: AppRouterWidget }),
  });
};
