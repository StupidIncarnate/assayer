/**
 * PURPOSE: Route target for the assayer stub-repository page — produces the stub-repository widget
 *   element via createElement (responders are .ts and can't use JSX or import react).
 *
 * USAGE:
 * createHashRouter([{ path: '/stubs', element: <StubsPageResponder /> }]);
 * // Renders the stub repository at the stubs route
 */
import { StubRepositoryWidget } from '../../../widgets/stub-repository/stub-repository-widget';
import { createElement } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';

export const StubsPageResponder = (): ReactElement =>
  createElement(StubRepositoryWidget);
