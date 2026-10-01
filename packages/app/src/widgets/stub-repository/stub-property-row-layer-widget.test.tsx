import { themedRenderMiddleware } from '../../middleware/themed-render/themed-render-middleware';
import { StubPropertyRowLayerWidget } from './stub-property-row-layer-widget';
import { StubPropertyRowLayerWidgetProxy } from './stub-property-row-layer-widget.proxy';
import { FlatPropertyDemandStub } from '../../contracts/flat-property-demand/flat-property-demand.stub';

describe('StubPropertyRowLayerWidget', () => {
  describe('demanded property', () => {
    it("VALID: {name: 'mode', demanded ['a', 'b']} => renders the name and one badge per value", () => {
      StubPropertyRowLayerWidgetProxy();
      const property = FlatPropertyDemandStub({
        name: 'mode',
        demand: { kind: 'demanded', values: ['a', 'b'] },
      });

      const { getByTestId, getAllByTestId, queryByTestId } = themedRenderMiddleware({
        ui: <StubPropertyRowLayerWidget property={property} />,
      });

      expect(getByTestId('STUB_PROPERTY').getAttribute('data-propname')).toBe('mode');
      expect(getAllByTestId('STUB_PROPERTY_VALUE').map((element) => element.textContent)).toStrictEqual(['a', 'b']);
      expect(queryByTestId('STUB_UNKNOWN')).toBe(null);
    });
  });

  describe('unknown property', () => {
    it("VALID: {name: 'retries', unknown} => renders the name and the unknown badge, no value badges", () => {
      StubPropertyRowLayerWidgetProxy();
      const property = FlatPropertyDemandStub({ name: 'retries', demand: { kind: 'unknown' } });

      const { getByTestId, queryByTestId } = themedRenderMiddleware({
        ui: <StubPropertyRowLayerWidget property={property} />,
      });

      expect(getByTestId('STUB_PROPERTY').getAttribute('data-propname')).toBe('retries');
      expect(getByTestId('STUB_UNKNOWN').textContent).toBe('unknown');
      expect(queryByTestId('STUB_PROPERTY_VALUE')).toBe(null);
    });
  });
});
