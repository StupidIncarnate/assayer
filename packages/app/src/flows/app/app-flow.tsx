/**
 * PURPOSE: The assayer renderer's route tree — a hash router (Electron loads over file://) whose
 *   index route points to the status page responder. Grows into the review-surface routes later.
 *
 * USAGE:
 * <AppFlow />
 * // Renders the routed application
 */
import { RouterProvider, createHashRouter } from 'react-router-dom';

import { StatusPageResponder } from '../../responders/status/page/status-page-responder';

export const AppFlow = (): React.JSX.Element => {
  const router = createHashRouter([{ path: '/', element: <StatusPageResponder /> }]);

  return <RouterProvider router={router} />;
};
