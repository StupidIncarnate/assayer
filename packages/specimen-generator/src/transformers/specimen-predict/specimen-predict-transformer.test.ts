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
        branches: [
          { kind: 'if', arm: 'then', line: 2, driven: 'driven' },
          { kind: 'if', arm: 'else', line: 2, driven: 'driven' },
        ],
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
        branches: [
          { kind: 'if', arm: 'then', line: 3, driven: 'never' },
          { kind: 'if', arm: 'else', line: 3, driven: 'driven' },
        ],
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
        branches: [
          { kind: 'if', arm: 'then', line: 3, driven: 'driven' },
          { kind: 'if', arm: 'else', line: 3, driven: 'never' },
        ],
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
        branches: [
          { kind: 'if', arm: 'then', line: 2, driven: 'never' },
          { kind: 'if', arm: 'else', line: 2, driven: 'driven' },
        ],
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
        branches: [
          { kind: 'if', arm: 'then', line: 3, driven: 'driven' },
          { kind: 'if', arm: 'else', line: 3, driven: 'never' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });
  });

  describe('an undriven if', () => {
    it('VALID: {leaf from process.argv, in a function} => the one case takes else, and the admission is on the if line', () => {
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
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 3, driven: 'never' },
          { kind: 'if', arm: 'else', line: 3, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 3 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {leaf from process.argv, liveArm is then} => the then arm is driven, else is never', () => {
      const source = [
        '',
        'export function classify(): string {',
        '    if (process.argv[2] === "yes" === false) {',
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
        liveArm: 'then',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 3, driven: 'driven' },
          { kind: 'if', arm: 'else', line: 3, driven: 'never' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 3 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {leaf from process.argv, in a class method} => the admission is on the if line, not the method line', () => {
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
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 3, driven: 'never' },
          { kind: 'if', arm: 'else', line: 3, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 3 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {leaf from process.argv, at module level} => loading the module runs the if once, so else is driven', () => {
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
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 1, driven: 'never' },
          { kind: 'if', arm: 'else', line: 1, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {leaf from process.argv, in an arrow called where it is written, arms log} => the if inside the arrow runs once, so the admission is on the if line', () => {
      const source = [
        '(() => {',
        '    if (Number(process.argv[2]) > 5) {',
        '        console.log("then");',
        '    }',
        '    console.log("else");',
        '})();',
        'export {};',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'log',
        provenances: ['external', 'literal'],
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 2, driven: 'never' },
          { kind: 'if', arm: 'else', line: 2, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 2 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {leaf from process.argv, in an arrow called where it is written, arms return} => the arms reach different exits, so the if never runs', () => {
      const source = [
        'export const result = (() => {',
        '    if (Number(process.argv[2]) > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '})();',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['external', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 2, driven: 'never' },
          { kind: 'if', arm: 'else', line: 2, driven: 'never' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {leaf from process.argv, in a function expression bound to a const, arms return} => the admission is on the if line, not line 1', () => {
      const source = [
        'export const classify = function (): string {',
        '    if (Number(process.argv[2]) > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '};',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'statement',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['external', 'literal'],
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 2, driven: 'never' },
          { kind: 'if', arm: 'else', line: 2, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 2 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {argv if and argv leaf ternary, in an arrow called where it is written, arms return} => the arrow is admitted once as a whole', () => {
      const source = [
        'export const result = ((): string => {',
        '    if (((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) > 5) {',
        '        return "then";',
        '    }',
        '    return "else";',
        '})();',
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
          { kind: 'if', arm: 'then', line: 2, driven: 'never' },
          { kind: 'if', arm: 'else', line: 2, driven: 'never' },
          { kind: 'ternary', arm: 'then', line: 2, driven: 'never' },
          { kind: 'ternary', arm: 'else', line: 2, driven: 'never' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it.each([
      {
        scope: 'a class method',
        source: [
          'export class Classify {',
          '    public run(): void {',
          '        if (Number(process.argv[2]) > 5) {',
          '            console.log("then");',
          '        }',
          '        console.log("else");',
          '    }',
          '}',
        ].join('\n'),
        line: 3,
        slotArm: 'log' as const,
      },
      {
        scope: 'a function',
        source: [
          'export function classify(): void {',
          '    if (Number(process.argv[2]) > 5) {',
          '        console.log("then");',
          '    }',
          '    console.log("else");',
          '}',
        ].join('\n'),
        line: 2,
        slotArm: 'log' as const,
      },
      {
        scope: 'a constructor',
        source: [
          'export class Classify {',
          '    public constructor() {',
          '        if (Number(process.argv[2]) > 5) {',
          '            console.log("then");',
          '        }',
          '        console.log("else");',
          '    }',
          '}',
        ].join('\n'),
        line: 3,
        slotArm: 'log' as const,
      },
      {
        scope: 'a generator',
        source: [
          'export function* classify(): Generator<string> {',
          '    if (Number(process.argv[2]) > 5) {',
          '        yield "then";',
          '    }',
          '    yield "else";',
          '}',
        ].join('\n'),
        line: 2,
        slotArm: 'yield' as const,
      },
    ])(
      'VALID: {leaf from process.argv, in $scope whose arms fall through} => a case reaches the exit without deciding the if, so it runs one way',
      ({ source, line, slotArm }) => {
        const result = specimenPredictTransformer({
          source,
          focusKind: 'statement',
          arms: ['then', 'else'],
          slotArm,
          provenances: ['external', 'literal'],
          liveArm: 'else',
        });

        expect(result).toStrictEqual({
          branches: [
            { kind: 'if', arm: 'then', line, driven: 'never' },
            { kind: 'if', arm: 'else', line, driven: 'driven' },
          ],
          caseFailures: [],
          lints: [],
          undriven: [{ startLine: line }],
          darkSpots: [],
          gaps: [],
        });
      },
    );
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
        branches: [
          { kind: 'ternary', arm: 'then', line: 2, driven: 'driven' },
          { kind: 'ternary', arm: 'else', line: 2, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {ternary in a parameter default, leaf from process.argv} => a case reaches the return without deciding the ternary, so it runs one way', () => {
      const source = [
        'export function classify(label: string = Number(process.argv[2]) > 5 ? "then" : "else"): string {',
        '    return label;',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'expression',
        arms: ['then', 'else'],
        provenances: ['external', 'literal'],
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'ternary', arm: 'then', line: 1, driven: 'never' },
          { kind: 'ternary', arm: 'else', line: 1, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {ternary returned, leaf from process.argv} => the ternary is the exit, so the one case takes else', () => {
      const source = [
        'export function classify(): string {',
        '    return Number(process.argv[2]) > 5 ? "then" : "else";',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'expression',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['external', 'literal'],
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'ternary', arm: 'then', line: 2, driven: 'never' },
          { kind: 'ternary', arm: 'else', line: 2, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 2 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it.each([
      {
        position: 'a class field',
        source: ['export class Classify {', '    public label = Number(process.argv[2]) > 5 ? "then" : "else";', '}'].join('\n'),
        line: 2,
      },
      {
        position: 'a static class field',
        source: ['export class Classify {', '    public static label = Number(process.argv[2]) > 5 ? "then" : "else";', '}'].join('\n'),
        line: 2,
      },
      {
        position: 'a call argument',
        source: ['console.log(', '    Number(process.argv[2]) > 5 ? "then" : "else",', ');', 'export {};'].join('\n'),
        line: 2,
      },
      {
        position: 'a yield',
        source: [
          'export function* classify(): Generator<string> {',
          '    yield Number(process.argv[2]) > 5 ? "then" : "else";',
          '}',
        ].join('\n'),
        line: 2,
      },
      {
        position: 'an object property',
        source: ['export const holder = {', '    label: Number(process.argv[2]) > 5 ? "then" : "else",', '};'].join('\n'),
        line: 2,
      },
      {
        position: 'an exported const',
        source: ['', 'export const label = Number(process.argv[2]) > 5 ? "then" : "else";'].join('\n'),
        line: 2,
      },
      {
        position: 'a module statement',
        source: ['const label = 1;', 'console.log(Number(process.argv[2]) > 5 ? "then" : "else");', 'export { label };'].join('\n'),
        line: 2,
      },
      {
        position: 'a function body statement',
        source: [
          'export function classify(): void {',
          '    console.log(Number(process.argv[2]) > 5 ? "then" : "else");',
          '}',
        ].join('\n'),
        line: 2,
      },
    ])(
      'VALID: {ternary in $position, leaf from process.argv} => the arms meet again, so it runs one way and is admitted on its own line',
      ({ source, line }) => {
        const result = specimenPredictTransformer({
          source,
          focusKind: 'expression',
          arms: ['then', 'else'],
          provenances: ['external', 'literal'],
          liveArm: 'else',
        });

        expect(result).toStrictEqual({
          branches: [
            { kind: 'ternary', arm: 'then', line, driven: 'never' },
            { kind: 'ternary', arm: 'else', line, driven: 'driven' },
          ],
          caseFailures: [],
          lints: [],
          undriven: [{ startLine: line }],
          darkSpots: [],
          gaps: [],
        });
      },
    );

    it('VALID: {ternary as a concise arrow body, leaf from process.argv} => the value is the exit, so the one case takes else', () => {
      const source = [
        'export const classify = (): string =>',
        '    Number(process.argv[2]) > 5 ? "then" : "else";',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'expression',
        arms: ['then', 'else'],
        provenances: ['external', 'literal'],
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'ternary', arm: 'then', line: 2, driven: 'never' },
          { kind: 'ternary', arm: 'else', line: 2, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 2 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {ternary returned in parentheses, leaf from process.argv} => the value is still the exit, so the one case takes else', () => {
      const source = [
        'export function classify(): string {',
        '    return (Number(process.argv[2]) > 5 ? "then" : "else");',
        '}',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'expression',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['external', 'literal'],
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'ternary', arm: 'then', line: 2, driven: 'never' },
          { kind: 'ternary', arm: 'else', line: 2, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 2 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {ternary returned from an arrow called where it is written, leaf from process.argv} => the arrow is admitted as a whole on its first line', () => {
      const source = [
        'export const label = (() => {',
        '    return Number(process.argv[2]) > 5 ? "then" : "else";',
        '})();',
      ].join('\n');

      const result = specimenPredictTransformer({
        source,
        focusKind: 'expression',
        arms: ['then', 'else'],
        slotArm: 'return',
        provenances: ['external', 'literal'],
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'ternary', arm: 'then', line: 2, driven: 'never' },
          { kind: 'ternary', arm: 'else', line: 2, driven: 'never' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }],
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
        branches: [
          { kind: 'ternary', arm: 'then', line: 3, driven: 'driven' },
          { kind: 'ternary', arm: 'else', line: 3, driven: 'never' },
        ],
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
          { kind: 'ternary', arm: 'then', line: 1, driven: 'driven' },
          { kind: 'ternary', arm: 'else', line: 1, driven: 'driven' },
          { kind: 'if', arm: 'then', line: 3, driven: 'driven' },
          { kind: 'if', arm: 'else', line: 3, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {maybe-number read from process.argv} => the one case runs the then arm of the argv ternary and the else arm of the if, and each is admitted on its own line', () => {
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
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 2, driven: 'never' },
          { kind: 'if', arm: 'else', line: 2, driven: 'driven' },
          { kind: 'ternary', arm: 'then', line: 2, driven: 'driven' },
          { kind: 'ternary', arm: 'else', line: 2, driven: 'never' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 2 }, { startLine: 2 }],
        darkSpots: [],
        gaps: [],
      });
    });

    it('ERROR: {env ternary in a scope undriven by an argv leaf} => throws, naming the env ternary line', () => {
      const source = [
        'const limit = process.env.LIMIT === undefined ? undefined : Number(process.env.LIMIT);',
        '',
        'if (Number(process.argv[2]) > (limit ?? 0)) {',
        '    console.log("then");',
        '}',
        'console.log("else");',
        'export {};',
      ].join('\n');

      expect(() =>
        specimenPredictTransformer({
          source,
          focusKind: 'statement',
          arms: ['then', 'else'],
          slotArm: 'log',
          provenances: ['external', 'env', 'literal'],
          liveArm: 'else',
        }),
      ).toThrow(
        /^specimen prediction: the process\.env ternary on line 1 sits in an undriven specimen, and no rule predicts which way it goes there\. Give the leaf a provenance other than env, or drop the external leaf\./u,
      );
    });

    it('VALID: {argv leaf ternary and an argv-read if, at module level} => loading the module runs both, and each is admitted on its own line, sorted', () => {
      const source = [
        'const limit = process.argv[2] === undefined ? undefined : Number(process.argv[2]);',
        '',
        'if ((limit ?? 0) > 5) {',
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
        liveArm: 'else',
      });

      expect(result).toStrictEqual({
        branches: [
          { kind: 'ternary', arm: 'then', line: 1, driven: 'driven' },
          { kind: 'ternary', arm: 'else', line: 1, driven: 'never' },
          { kind: 'if', arm: 'then', line: 3, driven: 'never' },
          { kind: 'if', arm: 'else', line: 3, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [{ startLine: 1 }, { startLine: 3 }],
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

    it('ERROR: {undriven, the branch runs in a case, no live arm given} => throws, listing the arms', () => {
      expect(() =>
        specimenPredictTransformer({
          source: 'export function classify(): string {\n    if (Number(process.argv[2]) > 5) {\n        return "then";\n    }\n    return "else";\n}',
          focusKind: 'statement',
          arms: ['then', 'else'],
          slotArm: 'return',
          provenances: ['external', 'literal'],
        }),
      ).toThrow(
        /^specimen prediction: an undriven specimen whose branch runs in a case needs the arm the test process's values reach, one of then, else\. It was given undefined\.$/u,
      );
    });

    it('ERROR: {argv ternary that does not test === undefined} => throws, naming its line', () => {
      const source = [
        'export function classify(): string {',
        '    if (((process.argv[2] !== undefined ? Number(process.argv[2]) : undefined) ?? 0) > 5) {',
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
          provenances: ['external', 'literal', 'literal'],
          liveArm: 'else',
        }),
      ).toThrow(
        /^specimen prediction: the process\.argv ternary on line 2 does not test `=== undefined`, so no rule predicts which arm it takes\. Write the leaf as `process\.argv\[2\] === undefined \? undefined : <read>`\./u,
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
