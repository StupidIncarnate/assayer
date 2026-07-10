import { codemirrorViewAdapterProxy } from '../../adapters/codemirror/view/codemirror-view-adapter.proxy';

export const CodeViewerWidgetProxy = (): Record<PropertyKey, never> => {
  codemirrorViewAdapterProxy();

  return {};
};
