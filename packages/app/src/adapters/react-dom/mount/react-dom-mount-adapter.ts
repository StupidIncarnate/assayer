/**
 * PURPOSE: Mounts a React node into a DOM container inside StrictMode + a Mantine provider,
 *   translating the react-dom createRoot API to an AdapterResult.
 *
 * USAGE:
 * reactDomMountAdapter({ container, content });
 * // Returns { success: true } after mounting
 */
import { StrictMode, createElement } from '#gateway/npm/react';
import type { ReactNode } from '#gateway/npm/react';
import { createRoot } from '#gateway/npm/react-dom__client';
import { MantineProvider } from '#gateway/npm/mantine__core';

import { appThemeStatics } from '../../../statics/app-theme/app-theme-statics';

export const reactDomMountAdapter = ({
  container,
  content,
}: {
  container: HTMLElement;
  content: ReactNode;
}): void => {
  createRoot(container).render(
    createElement(
      StrictMode,
      null,
      createElement(MantineProvider, { theme: appThemeStatics, forceColorScheme: 'dark' }, content),
    ),
  );

};
