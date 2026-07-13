/**
 * PURPOSE: The assayer renderer's route tree — a hash router (Electron loads over file://) whose
 *   index route points to the explorer page responder (the compiled surface explorer). Grows into
 *   the review-surface routes later.
 *
 * USAGE:
 * <AppFlow />
 * // Renders the routed application
 */
import { RouterProvider, createHashRouter } from 'react-router-dom';

import { ExplorerPageResponder } from '../../responders/explorer/page/explorer-page-responder';

export const AppFlow = (): React.JSX.Element => {
  const router = createHashRouter([{ path: '/', element: <ExplorerPageResponder /> }]);

  return <RouterProvider router={router} />;
};
