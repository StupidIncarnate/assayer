import { readDeclaredLayerTransformer } from './read-declared-layer-transformer';

describe('readDeclaredLayerTransformer', () => {
  describe('a syntax declaration', () => {
    it('VALID: {description, code, anchors} => returns them with a code that runs', () => {
      const result = readDeclaredLayerTransformer({
        declared: { description: 'a limit', code: (value: number) => value * 2, anchors: { limit: 5 } },
        file: 'gt.syntax.ts',
        origin: 'syntax',
      });

      const { code, ...rest } = result;

      expect({ rest, run: code(4) }).toStrictEqual({ rest: { description: 'a limit', anchors: { limit: 5 } }, run: 8 });
    });

    it('EMPTY: {no anchors} => returns empty anchors', () => {
      const result = readDeclaredLayerTransformer({
        declared: { description: 'a limit', code: () => undefined },
        file: 'if.syntax.ts',
        origin: 'syntax',
      });

      const { anchors, description } = result;

      expect({ anchors, description }).toStrictEqual({ anchors: {}, description: 'a limit' });
    });

    it('VALID: {syntax with form and range} => ignores shim-only properties', () => {
      const result = readDeclaredLayerTransformer({
        declared: { description: 'd', code: () => undefined, form: 1, range: 1 },
        file: 'if.syntax.ts',
        origin: 'syntax',
      });

      const { anchors, description } = result;

      expect({ anchors, description }).toStrictEqual({ anchors: {}, description: 'd' });
    });

    it('INVALID: {declared: null} => throws that the export is not an object', () => {
      expect(() =>
        readDeclaredLayerTransformer({ declared: null, file: 'gt.syntax.ts', origin: 'syntax' }),
      ).toThrow(
        /^gt\.syntax\.ts: the export is not an object\. Export the result of calling the kit function for this declaration\.$/u,
      );
    });

    it('INVALID: {declared: 5} => throws that the export is not an object', () => {
      expect(() => readDeclaredLayerTransformer({ declared: 5, file: 'gt.syntax.ts', origin: 'syntax' })).toThrow(
        /^gt\.syntax\.ts: the export is not an object\. Export the result of calling the kit function for this declaration\.$/u,
      );
    });

    it('INVALID: {description: 7} => throws that description must be a string', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 7, code: () => undefined },
          file: 'gt.syntax.ts',
          origin: 'syntax',
        }),
      ).toThrow(/^gt\.syntax\.ts: its `description` must be a string\. Add a one-line description\.$/u);
    });

    it('INVALID: {code: 7} => throws that code must be a function', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 'd', code: 7 },
          file: 'gt.syntax.ts',
          origin: 'syntax',
        }),
      ).toThrow(/^gt\.syntax\.ts: its `code` must be a function\. Write it as an arrow function\.$/u);
    });

    it('INVALID: {anchors: array} => throws that anchors must be an object', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 'd', code: () => undefined, anchors: [1] },
          file: 'gt.syntax.ts',
          origin: 'syntax',
        }),
      ).toThrow(
        /^gt\.syntax\.ts: its `anchors` must be an object that maps a hole name to a value\. Write anchors as an object\.$/u,
      );
    });

    it('INVALID: {anchors: null} => throws that anchors must be an object', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 'd', code: () => undefined, anchors: null },
          file: 'gt.syntax.ts',
          origin: 'syntax',
        }),
      ).toThrow(
        /^gt\.syntax\.ts: its `anchors` must be an object that maps a hole name to a value\. Write anchors as an object\.$/u,
      );
    });

    it('INVALID: {anchors: text} => throws that anchors must be an object', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 'd', code: () => undefined, anchors: 'x' },
          file: 'gt.syntax.ts',
          origin: 'syntax',
        }),
      ).toThrow(
        /^gt\.syntax\.ts: its `anchors` must be an object that maps a hole name to a value\. Write anchors as an object\.$/u,
      );
    });
  });

  describe('a shim declaration', () => {
    it('VALID: {form, builtin, no range} => returns them', () => {
      const result = readDeclaredLayerTransformer({
        declared: {
          description: 'reads one element',
          code: () => undefined,
          builtin: 'Array.prototype.at',
          form: { kind: 'method', name: 'at' },
        },
        file: 'array-at.shim.ts',
        origin: 'shim',
      });

      const { anchors, builtin, description, form, range } = result;

      expect({ anchors, builtin, description, form, range }).toStrictEqual({
        anchors: {},
        builtin: 'Array.prototype.at',
        description: 'reads one element',
        form: { kind: 'method', name: 'at' },
        range: undefined,
      });
    });

    it('VALID: {range and pin range} => returns the range', () => {
      const result = readDeclaredLayerTransformer({
        declared: {
          description: 'a random number',
          code: () => undefined,
          builtin: 'Math.random',
          form: { kind: 'call', name: 'Math.random' },
          range: { min: 0, max: 1, maxExclusive: true, whole: false },
          pin: 'range',
        },
        file: 'math-random.shim.ts',
        origin: 'shim',
      });

      const { range } = result;

      expect(range).toStrictEqual({ min: 0, max: 1, maxExclusive: true, whole: false });
    });

    it('VALID: {pin is a function} => accepts the pin', () => {
      const result = readDeclaredLayerTransformer({
        declared: {
          description: 'a uuid',
          code: () => undefined,
          builtin: 'crypto.randomUUID',
          form: { kind: 'getter', name: 'id' },
          pin: () => 'x',
        },
        file: 'uuid.shim.ts',
        origin: 'shim',
      });

      const { form } = result;

      expect(form).toStrictEqual({ kind: 'getter', name: 'id' });
    });

    it('INVALID: {no form} => throws that form must be { kind, name }', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 'd', code: () => undefined, builtin: 'b' },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `form` must be \{ kind, name \}, where kind is 'call', 'getter' or 'method' and name is a string\. Fix the form\.$/u,
      );
    });

    it('INVALID: {form kind: other} => throws that form must be { kind, name }', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 'd', code: () => undefined, builtin: 'b', form: { kind: 'other', name: 'n' } },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `form` must be \{ kind, name \}, where kind is 'call', 'getter' or 'method' and name is a string\. Fix the form\.$/u,
      );
    });

    it('INVALID: {form name: 3} => throws that form must be { kind, name }', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 'd', code: () => undefined, builtin: 'b', form: { kind: 'call', name: 3 } },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `form` must be \{ kind, name \}, where kind is 'call', 'getter' or 'method' and name is a string\. Fix the form\.$/u,
      );
    });

    it('INVALID: {no builtin} => throws that builtin must be a string', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: { description: 'd', code: () => undefined, form: { kind: 'call', name: 'n' } },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `builtin` must be a string that names the builtin the shim stands for\. Add the builtin\.$/u,
      );
    });

    it("INVALID: {pin: 'range', no range} => throws that the pin needs a range", () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: {
            description: 'd',
            code: () => undefined,
            builtin: 'b',
            form: { kind: 'call', name: 'n' },
            pin: 'range',
          },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(/^a\.shim\.ts: pin 'range' needs a range to pick values from\. Add a range, or use a pin function\.$/u);
    });

    it('INVALID: {pin: 4} => throws that the pin must be range or a function', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: {
            description: 'd',
            code: () => undefined,
            builtin: 'b',
            form: { kind: 'call', name: 'n' },
            pin: 4,
          },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(/^a\.shim\.ts: its `pin` must be 'range' or a function\. Fix the pin\.$/u);
    });

    it('INVALID: {range: min text} => throws that the range is malformed', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: {
            description: 'd',
            code: () => undefined,
            builtin: 'b',
            form: { kind: 'call', name: 'n' },
            range: { min: 'zero', max: 1, maxExclusive: true, whole: false },
          },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `range` must be \{ min, max, maxExclusive, whole \}, where min and max are numbers and the other two are booleans\. Fix the range\.$/u,
      );
    });

    it('INVALID: {range: max text} => throws that the range is malformed', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: {
            description: 'd',
            code: () => undefined,
            builtin: 'b',
            form: { kind: 'call', name: 'n' },
            range: { min: 0, max: 'one', maxExclusive: true, whole: false },
          },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `range` must be \{ min, max, maxExclusive, whole \}, where min and max are numbers and the other two are booleans\. Fix the range\.$/u,
      );
    });

    it('INVALID: {range: maxExclusive number} => throws that the range is malformed', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: {
            description: 'd',
            code: () => undefined,
            builtin: 'b',
            form: { kind: 'call', name: 'n' },
            range: { min: 0, max: 1, maxExclusive: 1, whole: false },
          },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `range` must be \{ min, max, maxExclusive, whole \}, where min and max are numbers and the other two are booleans\. Fix the range\.$/u,
      );
    });

    it('INVALID: {range: whole number} => throws that the range is malformed', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: {
            description: 'd',
            code: () => undefined,
            builtin: 'b',
            form: { kind: 'call', name: 'n' },
            range: { min: 0, max: 1, maxExclusive: true, whole: 0 },
          },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `range` must be \{ min, max, maxExclusive, whole \}, where min and max are numbers and the other two are booleans\. Fix the range\.$/u,
      );
    });

    it('INVALID: {range: text} => throws that the range is malformed', () => {
      expect(() =>
        readDeclaredLayerTransformer({
          declared: {
            description: 'd',
            code: () => undefined,
            builtin: 'b',
            form: { kind: 'call', name: 'n' },
            range: 'wide',
          },
          file: 'a.shim.ts',
          origin: 'shim',
        }),
      ).toThrow(
        /^a\.shim\.ts: its `range` must be \{ min, max, maxExclusive, whole \}, where min and max are numbers and the other two are booleans\. Fix the range\.$/u,
      );
    });
  });
});
