import { MemoryRouter } from 'react-router-dom';

import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { AppShellWidget } from './app-shell-widget';
import { AppShellWidgetProxy } from './app-shell-widget.proxy';

describe('AppShellWidget', () => {
  describe('the nav header', () => {
    it('VALID: {rendered at /} => shows the Explorer and Stub Repository links targeting their routes', () => {
      AppShellWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/']}>
            <AppShellWidget />
          </MemoryRouter>
        ),
      });

      expect(getByTestId('EXPLORER_NAV').textContent).toBe('Explorer');
      expect(getByTestId('EXPLORER_NAV').getAttribute('href')).toBe('/');
      expect(getByTestId('STUB_NAV').textContent).toBe('Stub Repository');
      expect(getByTestId('STUB_NAV').getAttribute('href')).toBe('/stubs');
    });

    it('VALID: {rendered at /stubs} => still shows both links so a human can switch back to the explorer', () => {
      AppShellWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/stubs']}>
            <AppShellWidget />
          </MemoryRouter>
        ),
      });

      expect(getByTestId('EXPLORER_NAV').getAttribute('href')).toBe('/');
      expect(getByTestId('STUB_NAV').getAttribute('href')).toBe('/stubs');
    });
  });
});
