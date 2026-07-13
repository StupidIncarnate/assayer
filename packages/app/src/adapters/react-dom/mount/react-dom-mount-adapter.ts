/**
 * PURPOSE: Mounts a React node into a DOM container inside StrictMode + a Mantine provider,
 *   translating the react-dom createRoot API to an AdapterResult.
 *
 * USAGE:
 * reactDomMountAdapter({ container, content });
 * // Returns { success: true } after mounting
 */
import { StrictMode, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { appThemeStatics } from '../../../statics/app-theme/app-theme-statics';

export const reactDomMountAdapter = ({
  container,
  content,
}: {
  container: HTMLElement;
  content: ReactNode;
}): AdapterResult => {
  createRoot(container).render(
    createElement(
      StrictMode,
      null,
      createElement(MantineProvider, { theme: appThemeStatics, forceColorScheme: 'dark' }, content),
    ),
  );

  return { success: true as const };
};
