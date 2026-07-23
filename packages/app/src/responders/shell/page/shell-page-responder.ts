/**
 * PURPOSE: Layout-route target for the app shell — produces the shell widget (the nav header +
 *   routed `<Outlet />`) via the create-element adapter, so the flow can wrap every page route in the
 *   nav without importing a widget itself (flows import responders, not widgets).
 *
 * USAGE:
 * createHashRouter([{ element: <ShellPageResponder />, children: [...routes] }]);
 * // Renders the nav header around whichever child route matches
 */
import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { AppShellWidget } from '../../../widgets/app-shell/app-shell-widget';

export const ShellPageResponder = (): ReturnType<typeof reactCreateElementAdapter> =>
  reactCreateElementAdapter({ component: AppShellWidget });
