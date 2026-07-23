/**
 * PURPOSE: The assayer renderer's route tree — a hash router (Electron loads over file://) whose
 *   routes render inside the app shell (a nav header the reader uses to switch views). The index
 *   route is the compiled-surface EXPLORER; `/stubs` is the STUB REPOSITORY. Grows into the rest of
 *   the review-surface routes later.
 *
 * USAGE:
 * <AppFlow />
 * // Renders the routed application
 */
import { RouterProvider, createHashRouter } from 'react-router-dom';

import { ShellPageResponder } from '../../responders/shell/page/shell-page-responder';
import { ExplorerPageResponder } from '../../responders/explorer/page/explorer-page-responder';
import { StubsPageResponder } from '../../responders/stubs/page/stubs-page-responder';

export const AppFlow = (): React.JSX.Element => {
  const router = createHashRouter([
    {
      element: <ShellPageResponder />,
      children: [
        { path: '/', element: <ExplorerPageResponder /> },
        { path: '/stubs', element: <StubsPageResponder /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};
