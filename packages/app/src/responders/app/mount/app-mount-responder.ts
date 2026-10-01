/**
 * PURPOSE: Mounts the assayer renderer's app tree into the #root DOM element in StrictMode and a Mantine
 *   provider. The single boundary responder the startup flow calls.
 *
 * USAGE:
 * AppMountResponder({ content: <AppFlow /> });
 * // Returns nothing after mounting; throws if #root is missing
 */

import { appThemeStatics } from '../../../statics/app-theme/app-theme-statics';
import { document } from '#gateway/browser/document';
import { MantineProvider } from '#gateway/npm/mantine__core';
import { StrictMode, createElement } from '#gateway/npm/react';
import { createRoot } from '#gateway/npm/react-dom__client';

export const AppMountResponder = ({ content }: { content: React.JSX.Element }): void => {
  const container = document.getElementById('root');

  if (container === null) {
    throw new Error('Root container "#root" not found');
  }

  createRoot(container).render(
    createElement(
      StrictMode,
      null,
      createElement(MantineProvider, { theme: appThemeStatics, forceColorScheme: 'dark' }, content),
    ),
  );
};
