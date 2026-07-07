/**
 * PURPOSE: Route target for the assayer status page — produces the status panel widget element
 *   via the create-element adapter (responders are .ts and can't use JSX or import react).
 *
 * USAGE:
 * createHashRouter([{ path: '/', element: <StatusPageResponder /> }]);
 * // Renders the status panel at the index route
 */
import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { StatusPanelWidget } from '../../../widgets/status-panel/status-panel-widget';

export const StatusPageResponder = (): ReturnType<typeof reactCreateElementAdapter> =>
  reactCreateElementAdapter({ component: StatusPanelWidget });
