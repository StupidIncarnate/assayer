import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { StubObjectCardLayerWidget } from './stub-object-card-layer-widget';
import { StubObjectCardLayerWidgetProxy } from './stub-object-card-layer-widget.proxy';
import { ObjectStubStub } from '@assayer/shared/contracts/object-stub/object-stub.stub';

describe('StubObjectCardLayerWidget', () => {
  describe('object stub', () => {
    it('VALID: {a stub with a demanded, a nested and an unknown property} => renders the key, one row per leaf property, and the readers', () => {
      StubObjectCardLayerWidgetProxy();
      const stub = ObjectStubStub({
        key: 'src/types.ts#Config',
        definitionRelPath: 'src/types.ts',
        typeName: 'Config',
        properties: [
          { name: 'mode', demand: { kind: 'demanded', values: ['a'] } },
          {
            name: 'db',
            demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3] } }] },
          },
          { name: 'region', demand: { kind: 'unknown' } },
        ],
        readers: ['src/reader.ts'],
      });

      const { getByTestId, getAllByTestId } = render(<StubObjectCardLayerWidget stub={stub} />, { wrapper: MantineProvider });

      expect(getByTestId('STUB_CARD').getAttribute('data-stubkey')).toBe('src/types.ts#Config');
      expect(getByTestId('STUB_KEY').textContent).toBe('src/types.ts#Config');
      expect(getAllByTestId('STUB_PROPERTY').map((element) => element.getAttribute('data-propname'))).toStrictEqual([
        'mode',
        'db.retry',
        'region',
      ]);
      expect(getAllByTestId('STUB_READER').map((element) => element.textContent)).toStrictEqual(['src/reader.ts']);
    });
  });
});
