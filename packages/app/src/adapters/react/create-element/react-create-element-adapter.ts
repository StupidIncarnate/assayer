/**
 * PURPOSE: Wraps React.createElement so responders can produce a widget element without JSX
 *   (responders must be .ts and cannot import react directly).
 *
 * USAGE:
 * reactCreateElementAdapter({ component: AppRouterWidget });
 * // Returns a React element for the given component
 */
import { createElement } from 'react';
import type { ComponentType, ReactElement } from 'react';

export const reactCreateElementAdapter = ({
  component,
}: {
  component: ComponentType;
}): ReactElement => createElement(component);
