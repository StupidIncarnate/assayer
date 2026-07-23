/**
 * PURPOSE: The renderer's top-level shell — a thin nav header over the routed view area. It gives a
 *   human two first-class surfaces to switch between: the compiled-surface EXPLORER (`/`) and the
 *   STUB REPOSITORY (`/stubs`). The active link is emphasised so the reader always knows which view
 *   they are on. The routed page renders through the `<Outlet />` below the nav, so switching views
 *   swaps only the body and keeps the nav in place.
 *
 * USAGE:
 * createHashRouter([{ element: <AppShellWidget />, children: [...routes] }]);
 * // Renders the nav header + the matched child route
 */
import type { ReactElement } from 'react';
import { Anchor, Box, Group } from '@mantine/core';
import { Link, Outlet, useLocation } from 'react-router-dom';

export const AppShellWidget = (): ReactElement => {
  const location = useLocation();
  const onStubs = location.pathname === '/stubs';

  return (
    <Box bg="dark.8" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box
        component="nav"
        bg="dark.9"
        px="md"
        py="xs"
        style={{ flexShrink: 0, borderBottom: '1px solid var(--mantine-color-dark-4)' }}
      >
        <Group gap="lg">
          <Anchor
            component={Link}
            to="/"
            data-testid="EXPLORER_NAV"
            fz="sm"
            fw={onStubs ? 'normal' : 'bold'}
            c={onStubs ? 'dimmed' : 'gray.1'}
            underline="never"
          >
            Explorer
          </Anchor>
          <Anchor
            component={Link}
            to="/stubs"
            data-testid="STUB_NAV"
            fz="sm"
            fw={onStubs ? 'bold' : 'normal'}
            c={onStubs ? 'gray.1' : 'dimmed'}
            underline="never"
          >
            Stub Repository
          </Anchor>
        </Group>
      </Box>
      <Box style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  );
};
