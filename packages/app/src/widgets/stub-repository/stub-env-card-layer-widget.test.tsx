import { themedRenderMiddleware } from '../../middleware/themed-render/themed-render-middleware';
import { StubEnvCardLayerWidget } from './stub-env-card-layer-widget';
import { StubEnvCardLayerWidgetProxy } from './stub-env-card-layer-widget.proxy';
import { EnvStubStub } from '@assayer/shared/contracts/env-stub/env-stub.stub';

describe('StubEnvCardLayerWidget', () => {
  describe('guessed values', () => {
    it('VALID: {guessed true, values [1, 2]} => renders the key, the guessed badge, both values and the reader', () => {
      StubEnvCardLayerWidgetProxy();
      const stub = EnvStubStub({
        key: 'process.env#CODE',
        property: 'CODE',
        values: [1, 2],
        guessed: true,
        readers: ['src/reader.ts'],
      });

      const { getByTestId, getAllByTestId } = themedRenderMiddleware({
        ui: <StubEnvCardLayerWidget stub={stub} />,
      });

      expect(getByTestId('STUB_CARD').getAttribute('data-stubkey')).toBe('process.env#CODE');
      expect(getByTestId('STUB_GUESSED').textContent).toBe('guessed');
      expect(getByTestId('STUB_PROPERTY').getAttribute('data-propname')).toBe('CODE');
      expect(getAllByTestId('STUB_PROPERTY_VALUE').map((element) => element.textContent)).toStrictEqual(['1', '2']);
      expect(getAllByTestId('STUB_READER').map((element) => element.textContent)).toStrictEqual(['src/reader.ts']);
    });
  });

  describe('corrected values', () => {
    it('VALID: {guessed false, no readers} => renders the corrected badge and the no-readers line', () => {
      StubEnvCardLayerWidgetProxy();
      const stub = EnvStubStub({ key: 'process.env#MODE', property: 'MODE', values: ['prod'], guessed: false, readers: [] });

      const { getByTestId, queryByTestId } = themedRenderMiddleware({
        ui: <StubEnvCardLayerWidget stub={stub} />,
      });

      expect(getByTestId('STUB_CORRECTED').textContent).toBe('corrected');
      expect(queryByTestId('STUB_GUESSED')).toBe(null);
      expect(getByTestId('STUB_NO_READERS').textContent).toBe('No readers');
    });
  });
});
