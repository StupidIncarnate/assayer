import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';

import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { envEncodeTransformer } from './env-encode-transformer';

describe('envEncodeTransformer', () => {
  describe('the raw read', () => {
    it('VALID: {steps: [], members: ["big"]} => the string itself', () => {
      expect(
        envEncodeTransformer({ steps: [], domain: ValueDomainStub({ members: ['big'] }), type: { kind: 'string' } }),
      ).toBe('big');
    });

    it('VALID: {steps: [], excluded: ["big"]} => the string representative, which is not "big"', () => {
      expect(
        envEncodeTransformer({ steps: [], domain: ValueDomainStub({ excluded: ['big'] }), type: { kind: 'string' } }),
      ).toBe('abc123');
    });

    it('VALID: {steps: [], length 2 or more} => a string of the shortest length the domain allows', () => {
      expect(
        envEncodeTransformer({ steps: [], domain: ValueDomainStub({ lengthMin: 2 }), type: { kind: 'string' } }),
      ).toBe('ab');
    });

    it('EDGE: {steps: [], members: [null]} => undefined, since no string written to the environment is null', () => {
      expect(
        envEncodeTransformer({ steps: [], domain: ValueDomainStub({ members: [null] }), type: { kind: 'string' } }),
      ).toBe(undefined);
    });
  });

  describe('the Number coercion', () => {
    it('VALID: {number, greater than 5} => the number written with String', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'number' })],
          domain: ValueDomainStub({ min: 5, minExclusive: true }),
          type: { kind: 'number' },
        }),
      ).toBe('6');
    });

    it('VALID: {number, anything but 0} => the number representative, which the domain admits', () => {
      expect(
        envEncodeTransformer({ steps: [EnvStepStub({ kind: 'number' })], domain: ValueDomainStub({ excluded: [0] }), type: { kind: 'number' } }),
      ).toBe('7');
    });

    it('VALID: {number, exactly 0} => "0"', () => {
      expect(
        envEncodeTransformer({ steps: [EnvStepStub({ kind: 'number' })], domain: ValueDomainStub({ members: [0] }), type: { kind: 'number' } }),
      ).toBe('0');
    });

    it('EMPTY: {number, no number admitted} => undefined', () => {
      expect(
        envEncodeTransformer({ steps: [EnvStepStub({ kind: 'number' })], domain: ValueDomainStub({ members: [] }), type: { kind: 'number' } }),
      ).toBe(undefined);
    });
  });

  describe('a comparison', () => {
    it('VALID: {equals "true", wants true} => "true"', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'equals', literal: 'true', negated: false })],
          domain: ValueDomainStub({ members: [true] }),
          type: { kind: 'boolean' },
        }),
      ).toBe('true');
    });

    it('VALID: {equals "true", wants false} => a string other than "true"', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'equals', literal: 'true', negated: false })],
          domain: ValueDomainStub({ members: [false] }),
          type: { kind: 'boolean' },
        }),
      ).toBe('abc123');
    });

    it('VALID: {not-equals "off", wants true} => a string other than "off"', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'equals', literal: 'off', negated: true })],
          domain: ValueDomainStub({ members: [true] }),
          type: { kind: 'boolean' },
        }),
      ).toBe('abc123');
    });

    it('VALID: {Number then equals 7, wants false} => a number other than 7, written with String', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'number' }), EnvStepStub({ kind: 'equals', literal: 7, negated: false })],
          domain: ValueDomainStub({ members: [false] }),
          type: { kind: 'boolean' },
        }),
      ).toBe('8');
    });

    it('VALID: {equals, domain names nothing} => the boolean representative false, so a string other than the literal', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'equals', literal: 'yes', negated: false })],
          domain: ValueDomainStub(),
          type: { kind: 'boolean' },
        }),
      ).toBe('abc123');
    });

    it('EMPTY: {equals, no boolean admitted} => undefined', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'equals', literal: 'yes', negated: false })],
          domain: ValueDomainStub({ members: [] }),
          type: { kind: 'boolean' },
        }),
      ).toBe(undefined);
    });
  });

  describe('a split list', () => {
    it('VALID: {default, split, map, length not 0} => one item', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'default', value: '' }), EnvStepStub({ kind: 'split', separator: ',' }), EnvStepStub({ kind: 'map' })],
          domain: ValueDomainStub({ lengthExcluded: [0] }),
          type: { kind: 'array', element: { kind: 'unknown', text: 'unknown' } },
        }),
      ).toBe('a');
    });

    it('VALID: {split, length greater than 5} => six items joined by the separator', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'split', separator: ',' })],
          domain: ValueDomainStub({ lengthMin: 5, lengthMinExclusive: true }),
          type: { kind: 'array', element: { kind: 'string' } },
        }),
      ).toBe('a,a,a,a,a,a');
    });

    it('VALID: {split on "a,", length 2} => items that avoid every character of the separator', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'split', separator: 'a,' })],
          domain: ValueDomainStub({ lengthMin: 2, lengthMax: 2 }),
          type: { kind: 'array', element: { kind: 'string' } },
        }),
      ).toBe('ba,b');
    });

    it('EMPTY: {split, length exactly 0} => undefined, since a split is never empty', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'split', separator: ',' })],
          domain: ValueDomainStub({ lengthMin: 0, lengthMax: 0 }),
          type: { kind: 'array', element: { kind: 'string' } },
        }),
      ).toBe(undefined);
    });

    it('EDGE: {split on a separator holding every filler character} => undefined', () => {
      expect(
        envEncodeTransformer({
          steps: [EnvStepStub({ kind: 'split', separator: 'abc' })],
          domain: ValueDomainStub({ lengthExcluded: [0] }),
          type: { kind: 'array', element: { kind: 'string' } },
        }),
      ).toBe(undefined);
    });
  });
});
