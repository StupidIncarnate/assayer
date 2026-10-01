import { SourceEditorLayerWidgetProxy } from './source-editor-layer-widget.proxy';

export const CodeViewerWidgetProxy = (): Record<PropertyKey, never> => {
  SourceEditorLayerWidgetProxy();

  return {};
};
