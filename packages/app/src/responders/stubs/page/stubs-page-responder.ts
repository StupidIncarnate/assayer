/**
 * PURPOSE: Route target for the assayer stub-repository page — produces the stub-repository widget
 *   element via the create-element adapter (responders are .ts and can't use JSX or import react).
 *
 * USAGE:
 * createHashRouter([{ path: '/stubs', element: <StubsPageResponder /> }]);
 * // Renders the stub repository at the stubs route
 */
import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { StubRepositoryWidget } from '../../../widgets/stub-repository/stub-repository-widget';

export const StubsPageResponder = (): ReturnType<typeof reactCreateElementAdapter> =>
  reactCreateElementAdapter({ component: StubRepositoryWidget });
