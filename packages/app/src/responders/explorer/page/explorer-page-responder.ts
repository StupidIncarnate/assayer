/**
 * PURPOSE: Route target for the assayer compiled-surface explorer page — produces the surface
 *   explorer widget element via createElement (responders are .ts and can't use JSX
 *   or import react).
 *
 * USAGE:
 * createHashRouter([{ path: '/explorer', element: <ExplorerPageResponder /> }]);
 * // Renders the surface explorer at the explorer route
 */
import { SurfaceExplorerWidget } from '../../../widgets/surface-explorer/surface-explorer-widget';
import { createElement } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';

export const ExplorerPageResponder = (): ReactElement =>
  createElement(SurfaceExplorerWidget);
