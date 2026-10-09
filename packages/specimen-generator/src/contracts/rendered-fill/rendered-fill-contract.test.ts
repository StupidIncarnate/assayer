import { renderedFillContract } from './rendered-fill-contract';
import { RenderedFillStub } from './rendered-fill.stub';

describe('renderedFillContract', () => {
  describe('valid fills', () => {
    it('VALID: {stub default} => parses text, one parameter and no declarations', () => {
      const fill = RenderedFillStub();

      const result = renderedFillContract.parse(fill);

      expect(result).toStrictEqual({
        text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
        params: [{ name: 'value', type: 'number' }],
        declarations: [],
      });
    });

    it('VALID: {declarations: one} => parses the declaration name and text', () => {
      const fill = RenderedFillStub({
        declarations: [{ name: 'limit', text: 'const limit: number = 3;' }] as never,
      });

      const result = renderedFillContract.parse(fill);

      expect(result.declarations).toStrictEqual([{ name: 'limit', text: 'const limit: number = 3;' }]);
    });

    it('EMPTY: {text: "", params: []} => parses, since a fill can need nothing', () => {
      const fill = RenderedFillStub({ text: '' as never, params: [] });

      const result = renderedFillContract.parse(fill);

      expect(result).toStrictEqual({ text: '', params: [], declarations: [] });
    });
  });

  describe('invalid fills', () => {
    it('INVALID: {params: [{name: ""}]} => throws, since a parameter needs a name', () => {
      expect(() => {
        return renderedFillContract.parse({ ...RenderedFillStub(), params: [{ name: '', type: 'number' }] });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {declarations: [{text: ""}]} => throws, since a declaration needs text', () => {
      expect(() => {
        return renderedFillContract.parse({
          ...RenderedFillStub(),
          declarations: [{ name: 'limit', text: '' }],
        });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {text: missing} => throws, since a fill needs text', () => {
      expect(() => {
        return renderedFillContract.parse({ params: [], declarations: [] });
      }).toThrow(/expected string, received undefined/u);
    });
  });
});
