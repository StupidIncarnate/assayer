import { reactCreateElementAdapterProxy } from '../../../adapters/react/create-element/react-create-element-adapter.proxy';
import { AppShellWidgetProxy } from '../../../widgets/app-shell/app-shell-widget.proxy';

export const ShellPageResponderProxy = (): Record<PropertyKey, never> => {
  reactCreateElementAdapterProxy();
  AppShellWidgetProxy();

  return {};
};
