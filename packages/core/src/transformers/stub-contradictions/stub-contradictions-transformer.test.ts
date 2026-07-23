import { StubOverlayStub } from '@assayer/shared/contracts';

import { PropertyGuardStub } from '../../contracts/property-guard/property-guard.stub';

import { stubContradictionsTransformer } from './stub-contradictions-transformer';

// A guard that reads `Config.mode` and requires it to equal 'a', at src/decide.ts:6.
const modeGuard = PropertyGuardStub({
  key: 'src/config/config.ts#Config',
  property: 'mode',
  reader: 'src/decide.ts',
  line: 6,
  predicate: { kind: 'eq', literal: 'a' },
  operandType: { kind: 'string' },
});

describe('stubContradictionsTransformer', () => {
  describe('a committed correction whose values cannot satisfy a guard', () => {
    // The pre-run contradiction, caught BEFORE running: the human corrected `mode` to a set WITHOUT 'a',
    // so the `mode === 'a'` guard is dead under that truth — the case engine would emit a bogus case, so
    // instead a P1 names the overlay file, the property, the reader:line, and what the guard needs.
    it("INVALID: {mode corrected to ['dev','prod'], guard needs mode === 'a'} => a P1 contradiction naming the overlay, property, reader:line, and the guard's need", () => {
      const result = stubContradictionsTransformer({
        guards: [modeGuard],
        overlays: [
          StubOverlayStub({
            key: 'src/config/config.ts#Config',
            overlayPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
            properties: [{ name: 'mode', values: ['dev', 'prod'] }],
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
          line: 1,
          column: 1,
          message: "corrected values for property 'mode' cannot satisfy the guard at src/decide.ts:6 (needs 'mode' === 'a') — rectify this stub",
        },
      ]);
    });
  });

  describe('a committed correction that DOES include a value the guard admits', () => {
    it("VALID: {mode corrected to ['a','dev'], guard needs mode === 'a'} => no contradiction ('a' satisfies it)", () => {
      const result = stubContradictionsTransformer({
        guards: [modeGuard],
        overlays: [
          StubOverlayStub({
            key: 'src/config/config.ts#Config',
            overlayPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
            properties: [{ name: 'mode', values: ['a', 'dev'] }],
          }),
        ],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a guard on a property with no committed correction', () => {
    it('VALID: {no overlay for the type} => no contradiction (uncorrected demands are non-authoritative)', () => {
      const result = stubContradictionsTransformer({ guards: [modeGuard], overlays: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a literal-less guard whose satisfying domain is a sample', () => {
    // A truthy guard's satisfying domain is a representative SAMPLE, not a constraint, so intersecting
    // corrected values with it would report correct code dead. Skipped, exactly as is-domain-empty
    // refuses to prove an emptiness it cannot witness.
    it('VALID: {mode corrected to a set, guard is truthy (no literal)} => no contradiction (skipped)', () => {
      const result = stubContradictionsTransformer({
        guards: [PropertyGuardStub({ key: 'src/config/config.ts#Config', property: 'mode', reader: 'src/decide.ts', line: 6, predicate: { kind: 'truthy' }, operandType: { kind: 'string' } })],
        overlays: [
          StubOverlayStub({
            key: 'src/config/config.ts#Config',
            overlayPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
            properties: [{ name: 'mode', values: ['dev', 'prod'] }],
          }),
        ],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a numeric guard the corrected values cannot reach', () => {
    it("INVALID: {retries corrected to [1,2], guard needs retries > 5} => a P1 contradiction naming the '>' need", () => {
      const result = stubContradictionsTransformer({
        guards: [PropertyGuardStub({ key: 'src/config/config.ts#Config', property: 'retries', reader: 'src/decide.ts', line: 9, predicate: { kind: 'gt', literal: 5 }, operandType: { kind: 'number' } })],
        overlays: [
          StubOverlayStub({
            key: 'src/config/config.ts#Config',
            overlayPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
            properties: [{ name: 'retries', values: [1, 2] }],
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
          line: 1,
          column: 1,
          message: "corrected values for property 'retries' cannot satisfy the guard at src/decide.ts:9 (needs 'retries' > 5) — rectify this stub",
        },
      ]);
    });
  });
});
