import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { ContractEntryLayerWidget } from './contract-entry-layer-widget';
import { ContractEntryLayerWidgetProxy } from './contract-entry-layer-widget.proxy';
import { ExternalSignatureStub } from '@assayer/shared/contracts/external-signature/external-signature.stub';
import { ResolvedEdgeStub } from '@assayer/shared/contracts/resolved-edge/resolved-edge.stub';

describe('ContractEntryLayerWidget', () => {
  describe('a local edge', () => {
    it('VALID: {local edge, no params, returns string} => renders symbol, source path, a dash input and the return', () => {
      ContractEntryLayerWidgetProxy();
      const edge = ResolvedEdgeStub({
        specifier: './greeting',
        importedName: 'greeting',
        target: {
          kind: 'local',
          relPath: 'src/greeting.ts',
          signature: ExternalSignatureStub({ params: [], returnType: { kind: 'string' } }),
        },
      });

      const { getByTestId } = render(<ContractEntryLayerWidget edge={edge} />, { wrapper: MantineProvider });

      expect(getByTestId('CONTRACT_SYMBOL').textContent).toBe('greeting');
      expect(getByTestId('CONTRACT_SOURCE').textContent).toBe("import './greeting' → src/greeting.ts");
      expect(getByTestId('CONTRACT_INPUT').textContent).toBe('—');
      expect(getByTestId('CONTRACT_OUTPUT').textContent).toBe('returns string');
    });
  });

  describe('a package edge', () => {
    it('VALID: {package edge with one param} => renders one input line per param', () => {
      ContractEntryLayerWidgetProxy();
      const edge = ResolvedEdgeStub({
        specifier: 'vendored-pkg',
        importedName: 'greet',
        target: {
          kind: 'package',
          packageName: 'vendored-pkg',
          signature: ExternalSignatureStub({
            params: [{ name: 'name', type: { kind: 'string' } }],
            returnType: { kind: 'string' },
          }),
        },
      });

      const { getByTestId } = render(<ContractEntryLayerWidget edge={edge} />, { wrapper: MantineProvider });

      expect(getByTestId('CONTRACT_SOURCE').textContent).toBe('pkg vendored-pkg');
      expect(getByTestId('CONTRACT_INPUT').textContent).toBe('name: string');
    });

    it('EMPTY: {package edge with no signature and no type} => renders no output line', () => {
      ContractEntryLayerWidgetProxy();
      const edge = ResolvedEdgeStub({
        specifier: 'vendored-pkg',
        importedName: 'greet',
        target: { kind: 'package', packageName: 'vendored-pkg' },
      });

      const { queryByTestId } = render(<ContractEntryLayerWidget edge={edge} />, { wrapper: MantineProvider });

      expect(queryByTestId('CONTRACT_OUTPUT')).toBe(null);
    });
  });
});
