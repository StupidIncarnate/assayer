/**
 * PURPOSE: Wraps @testing-library/react render in a Mantine provider so widget and page
 *   responder tests can render UI without importing testing-library or Mantine directly.
 *
 * USAGE:
 * const { getByTestId } = testingLibraryRenderAdapter({ ui: someElement });
 * // Returns the RenderResult from @testing-library/react
 */
import { createElement } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import { MantineProvider } from '#gateway/npm/mantine__core';
import type { RenderResult } from '#gateway/npm/testing-library__react';
import { render } from '#gateway/npm/testing-library__react';

import { appThemeStatics } from '../../../statics/app-theme/app-theme-statics';

export const testingLibraryRenderAdapter = ({ ui }: { ui: ReactElement }): RenderResult =>
  render(createElement(MantineProvider, { theme: appThemeStatics, forceColorScheme: 'dark' }, ui));
