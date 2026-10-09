import { specimenPredictTransformer } from './specimen-predict-transformer';

describe('specimenPredictTransformer', () => {
  describe('a driven if', () => {
    it('VALID: {if in a function, leaf from a param} => the if goes both ways, nothing admitted', () => {
      const source = [
        'export function classify(value: number): string {',
        '    if (value > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['param', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'if', line: 2, driven: 'both-ways' }],
        caseFailures: [],
        lints: [],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });
  });

  describe('a locked if whose arms return', () => {
    it('VALID: {known value reaches else} => the if goes one way, the then return is unreachable', () => {
      const source = [
        'const value: number = 3;',
        'export function classify(): string {',
        '    if (value > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['const', 'literal'],
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'if', line: 3, driven: 'one-way' }],
        caseFailures: [],
        lints: [{ rule: 'unreachable-exit', startLine: 4 }],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {known value reaches then} => the else return is unreachable', () => {
      const source = [
        'const value: number = 7;',
        'export function classify(): string {',
        '    if (value > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['const', 'literal'],
        liveArm: 'then',
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'if', line: 3, driven: 'one-way' }],
        caseFailures: [],
        lints: [{ rule: 'unreachable-exit', startLine: 6 }],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });
  });

  describe('a locked if whose arms do not return', () => {
    it('VALID: {known value reaches else, arms log} => the then arm is dead and linted', () => {
      const source = [
        'const value: number = 3;',
        'if (value > 5) {',
        '    console.log("then");',
        '}',
        'console.log("else");',
        'export {};',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'log',
        provenances: ['const', 'literal'],
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'if', line: 2, driven: 'one-way' }],
        caseFailures: [],
        lints: [{ rule: 'unreachable-exit', startLine: 3 }],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {known value reaches then, arms yield} => no lint, because the else arm is just the code after the if', () => {
      const source = [
        'const value: number = 7;',
        'export function* classify(): Generator<string> {',
        '    if (value > 5) {',
        '        yield "then";',
        '    }',
        '    yield "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'yield',
        provenances: ['const', 'literal'],
        liveArm: 'then',
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'if', line: 3, driven: 'one-way' }],
        caseFailures: [],
        lints: [],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });
  });

  describe('an undriven if', () => {
    it('VALID: {leaf from process.argv, in a function} => the if never runs, the function is undriven', () => {
      const source = [
        '',
        'export function classify(): string {',
        '    if (Number(process.argv[2]) > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['external', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'if', line: 3, driven: 'never' }],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 2 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {leaf from process.argv, in a class method} => the method is the undriven scope', () => {
      const source = [
        'export class Classify {',
        '    public run(): string {',
        '        if (Number(process.argv[2]) > 5) {',
        '            return "then";',
        '        }',
        '        return "else";',
        '    }',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['external', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'if', line: 3, driven: 'never' }],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 2 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {leaf from process.argv, at module level} => the module, line 1, is undriven', () => {
      const source = [
        'if (Number(process.argv[2]) > 5) {',
        '    console.log("then");',
        '}',
        'console.log("else");',
        'export {};',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'log',
        provenances: ['external', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'if', line: 1, driven: 'never' }],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }],
        darkSpots: [],
        gaps: [],
      });
    });
  });

  describe('a ternary focus', () => {
    it('VALID: {ternary returned, leaf from a param} => the ternary goes both ways', () => {
      const source = [
        'export function classify(value: number): string {',
        '    return value > 5 ? "then" : "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'expression',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['param', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'ternary', line: 2, driven: 'both-ways' }],
        caseFailures: [],
        lints: [],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {ternary in a field, known value reaches then} => one way, the else arm is unreachable', () => {
      const source = [
        'const value: number = 7;',
        'export class Classify {',
        '    public label = value > 5',
        '        ? "then"',
        '        : "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'expression',
        arms: ['then', 'else'],
        provenances: ['const', 'literal'],
        liveArm: 'then',
      });

      expect(result).toStrictEqual({
        branches: [{ kind: 'ternary', line: 3, driven: 'one-way' }],
        caseFailures: [],
        lints: [{ rule: 'unreachable-exit', startLine: 5 }],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });
  });

  describe('a leaf written as a ternary of its own', () => {
    it('VALID: {maybe-number read from process.env} => the env ternary and the if both go both ways', () => {
      const source = [
        'const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);',
        '',
        'if ((value ?? 0) > 5) {',
        '    console.log("then");',
        '}',
        'console.log("else");',
        'export {};',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'log',
        provenances: ['env', 'literal', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'ternary', line: 1, driven: 'both-ways' },
          { kind: 'if', line: 3, driven: 'both-ways' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {maybe-number read from process.argv} => the argv ternary and the if never run', () => {
      const source = [
        'export function classify(): string {',
        '    if (((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['external', 'literal', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', line: 2, driven: 'never' },
          { kind: 'ternary', line: 2, driven: 'never' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {env ternary in a scope undriven by an argv leaf} => the env ternary never runs either', () => {
      const source = [
        'const limit = process.env.LIMIT === undefined ? undefined : Number(process.env.LIMIT);',
        '',
        'if (Number(process.argv[2]) > (limit ?? 0)) {',
        '    console.log("then");',
        '}',
        'console.log("else");',
        'export {};',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'log',
        provenances: ['external', 'env', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'ternary', line: 1, driven: 'never' },
          { kind: 'if', line: 3, driven: 'never' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }],
        darkSpots: [],
        gaps: [],
      });
    });
  });

  describe('refusals', () => {
    it('ERROR: {statement focus, no if in the source} => throws, naming what it expected and found', () => {
      expect(() =>
        specimenPredictTransformer({
          source: 'export const label = "then";',
          focusKind: 'statement',
          arms: ['then', 'else'],
          slotArm: 'return',
          provenances: ['param'],
        }),
      ).toThrow(
        /^specimen prediction: expected exactly one focus if statement in the generated source, found 0\. The source is:\nexport const label = "then";$/u,
      );
    });

    it('ERROR: {expression focus, two matching ternaries} => throws, naming the arms', () => {
      expect(() =>
        specimenPredictTransformer({
          source: 'export const a = (n: number): string => (n > 1 ? "then" : "else") + (n > 2 ? "then" : "else");',
          focusKind: 'expression',
          arms: ['then', 'else'],
          provenances: ['param'],
        }),
      ).toThrow(/^specimen prediction: expected exactly one focus ternary with the arms then and else in the generated source, found 2\./u);
    });

    it('ERROR: {a second branch that reads neither env nor argv} => throws, naming its line', () => {
      const source = [
        'export function classify(value: number): string {',
        '    const shifted = value > 0 ? value : 0;',
        '    if (shifted > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '}',
      ].join('\n');

      expect(() =>
        specimenPredictTransformer({
          source,
          focusKind: 'statement',
          arms: ['then', 'else'],
          slotArm: 'return',
          provenances: ['param'],
        }),
      ).toThrow(
        /^specimen prediction: the branch on line 2 is not the focus and reads neither process\.env nor process\.argv, so no rule predicts it\./u,
      );
    });

    it('ERROR: {locked, no live arm given} => throws, listing the arms', () => {
      expect(() =>
        specimenPredictTransformer({
          source: 'const value: number = 3;\nif (value > 5) {\n    console.log("then");\n}\nconsole.log("else");',
          focusKind: 'statement',
          arms: ['then', 'else'],
          slotArm: 'log',
          provenances: ['const'],
        }),
      ).toThrow(
        /^specimen prediction: a locked specimen needs the arm its known values reach, one of then, else\. It was given undefined\.$/u,
      );
    });

    it('ERROR: {locked, dead arm not written in the source} => throws, naming the arm', () => {
      expect(() =>
        specimenPredictTransformer({
          source: 'const value: number = 3;\nif (value > 5) {\n    console.log("x");\n}\nconsole.log("else");',
          focusKind: 'statement',
          arms: ['then', 'else'],
          slotArm: 'log',
          provenances: ['const'],
          liveArm: 'else',
        }),
      ).toThrow(/^specimen prediction: the dead arm 'then' is not written anywhere in the generated source\./u);
    });
  });
});
