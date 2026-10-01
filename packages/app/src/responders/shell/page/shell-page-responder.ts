/**
 * PURPOSE: Layout-route target for the app shell — produces the shell widget (the nav header +
 *   routed `<Outlet />`) via createElement, so the flow can wrap every page route in the
 *   nav without importing a widget itself (flows import responders, not widgets).
 *
 * USAGE:
 * createHashRouter([{ element: <ShellPageResponder />, children: [...routes] }]);
 * // Renders the nav header around whichever child route matches
 */
import { AppShellWidget } from '../../../widgets/app-shell/app-shell-widget';
import { createElement } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';

export const ShellPageResponder = (): ReactElement =>
  createElement(AppShellWidget);
