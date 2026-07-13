import { appThemeStatics } from './app-theme-statics';

describe('appThemeStatics', () => {
  describe('assayer UI theme override', () => {
    it('VALID: appThemeStatics => the indigo-accented Mantine theme with the sans/monospace type stack', () => {
      expect(appThemeStatics).toStrictEqual({
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
      });
    });
  });
});
