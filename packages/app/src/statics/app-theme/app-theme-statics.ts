/**
 * PURPOSE: The Assayer renderer's single UI theme — a Mantine theme override (accent color,
 *   radius, and the sans/monospace type stack) applied at every mount point so the whole app
 *   reads as one system. Plain data only (statics import nothing external); the react-dom mount
 *   adapter and the testing render adapter own the @mantine/core coupling and hand this to
 *   MantineProvider.
 *
 * USAGE:
 * createElement(MantineProvider, { theme: appThemeStatics }, content);
 * // Applies the Assayer theme to the provided subtree
 */
export const appThemeStatics = {
  primaryColor: 'indigo',
  defaultRadius: 'sm',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  headings: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '600',
  },
} as const;
