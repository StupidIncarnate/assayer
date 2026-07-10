/**
 * PURPOSE: Route target for the assayer compiled-surface explorer page — produces the surface
 *   explorer widget element via the create-element adapter (responders are .ts and can't use JSX
 *   or import react).
 *
 * USAGE:
 * createHashRouter([{ path: '/explorer', element: <ExplorerPageResponder /> }]);
 * // Renders the surface explorer at the explorer route
 */
import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { SurfaceExplorerWidget } from '../../../widgets/surface-explorer/surface-explorer-widget';

export const ExplorerPageResponder = (): ReturnType<typeof reactCreateElementAdapter> =>
  reactCreateElementAdapter({ component: SurfaceExplorerWidget });
