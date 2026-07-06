/**
 * PURPOSE: Wraps @testing-library/react render in a Mantine provider so widget and page
 *   responder tests can render UI without importing testing-library or Mantine directly.
 *
 * USAGE:
 * const { getByTestId } = testingLibraryRenderAdapter({ ui: someElement });
 * // Returns the RenderResult from @testing-library/react
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { MantineProvider } from '@mantine/core';
import type { RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';

export const testingLibraryRenderAdapter = ({ ui }: { ui: ReactElement }): RenderResult =>
  render(createElement(MantineProvider, null, ui));
