/**
 * PURPOSE: The assayer renderer's route tree — a hash router (Electron loads over file://) with
 *   the status panel as the sole route today; grows into the review-surface routes later.
 *
 * USAGE:
 * <AppRouterWidget />
 * // Renders the routed application
 */
import type { ReactElement } from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';

import { StatusPanelWidget } from '../status-panel/status-panel-widget';

export const AppRouterWidget = (): ReactElement => {
  const router = createHashRouter([{ path: '/', element: <StatusPanelWidget /> }]);

  return <RouterProvider router={router} />;
};
