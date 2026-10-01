import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { StubReadersLayerWidget } from './stub-readers-layer-widget';
import { StubReadersLayerWidgetProxy } from './stub-readers-layer-widget.proxy';
import { ObjectStubStub } from '@assayer/shared/contracts/object-stub/object-stub.stub';

describe('StubReadersLayerWidget', () => {
  describe('with readers', () => {
    it('VALID: {two readers} => renders one STUB_READER line per path, in order, and no empty line', () => {
      StubReadersLayerWidgetProxy();
      const { readers } = ObjectStubStub({ readers: ['src/a.ts', 'src/b.ts'] });

      const { getAllByTestId, queryByTestId } = render(<StubReadersLayerWidget readers={readers} />, { wrapper: MantineProvider });

      expect(getAllByTestId('STUB_READER').map((element) => element.textContent)).toStrictEqual(['src/a.ts', 'src/b.ts']);
      expect(queryByTestId('STUB_NO_READERS')).toBe(null);
    });
  });

  describe('without readers', () => {
    it('EMPTY: {no readers} => renders the no-readers line and no reader paths', () => {
      StubReadersLayerWidgetProxy();
      const { readers } = ObjectStubStub({ readers: [] });

      const { getByTestId, queryByTestId } = render(<StubReadersLayerWidget readers={readers} />, { wrapper: MantineProvider });

      expect(getByTestId('STUB_NO_READERS').textContent).toBe('No readers');
      expect(queryByTestId('STUB_READER')).toBe(null);
    });
  });
});
