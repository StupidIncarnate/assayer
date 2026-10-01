'use strict';

/**
 * PURPOSE: Integration test for `no-nullish-coalescing-on-arrange-value`. A lint rule is logic written
 *   against real syntax, so a hand-built fake AST node would prove nothing about whether the rule fires
 *   on real code — this uses `RuleTester`, which parses each `code` string for real, type-checks it
 *   against a real tsconfig (`./fixtures/tsconfig.json`), and runs the rule against the actual
 *   type-checked AST, exactly as `npm run ward -- --only lint` does.
 *
 *   Every fixture imports the REAL `RepresentativeValue` and `ArrangeValue` types from
 *   packages/shared/src/contracts, not a hand-rolled stand-in. The rule matches on the checker's model
 *   of those exact types, so a simplified stand-in would not exercise the real code path.
 *
 *   The invalid cases are the `??` shapes this rule exists to catch. Three are `??` chains modelled on
 *   `objectArrangeTransformer` (packages/core/src/transformers/object-arrange/). One is
 *   `const literalPoint = literal ?? rep;`, modelled on `typeToRangeTransformer`
 *   (packages/core/src/transformers/type-to-range/). In each, `null` is a valid arrange value, and `??`
 *   throws it away. The "`??` throws away a valid `null`" entry of plan/open-defects.md explains why
 *   that is a defect.
 *
 *   The last two valid cases default an array, and a `Map#get()` result, to a fallback array. These are
 *   the shapes `handler-result-layer-transformer.ts` and `is-domain-empty-guard.ts` use. The rule must
 *   not fire on them, because only a discarded scalar `null` is a defect. A rule that matched on the
 *   rendered type text would fire on both.
 */

const path = require('node:path');
const { RuleTester } = require('@typescript-eslint/rule-tester');

const rule = require('./no-nullish-coalescing-on-arrange-value-rule');

// Both fixtures import the real contracts by relative path (repo root is three levels up from
// eslint-rules/no-nullish-coalescing-on-arrange-value/fixtures/), so every test case type-checks
// against the same branded types the real analyzer source does.
const CONTRACT_IMPORTS = `
import type { RepresentativeValue } from '../../../packages/shared/src/contracts/representative-value/representative-value-contract';
import type { ArrangeValue } from '../../../packages/shared/src/contracts/arrange-value/arrange-value-contract';
`;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: path.join(__dirname, 'fixtures'),
      project: './tsconfig.json',
    },
  },
});

ruleTester.run('no-nullish-coalescing-on-arrange-value', rule, {
  valid: [
    {
      // An ORDINARY nullable string — not RepresentativeValue, not ArrangeValue. The rule must not
      // treat every `T | null` as suspicious, only the two named contracts.
      name: 'VALID: ?? on an ordinary nullable string, unrelated to either contract',
      code: `${CONTRACT_IMPORTS}
declare const config: { mode: string | null };
const mode = config.mode ?? 'default';
`,
    },
    {
      // The FIX shape itself: an explicit === undefined check instead of ??. This is exactly what
      // 20dc86c replaced every flagged chain with, and it must read as clean.
      name: 'VALID: the corrected `x === undefined ? fallback : x` form on a RepresentativeValue',
      code: `${CONTRACT_IMPORTS}
declare const usableValues: RepresentativeValue[];
declare function fillValueTransformer(): RepresentativeValue;
const value = usableValues[0] === undefined ? fillValueTransformer() : usableValues[0];
`,
    },
    {
      // REGRESSION LOCK. Reconstructs packages/core/src/transformers/walk-file/
      // handler-result-layer-transformer.ts:62 — `calls ?? []`, where `calls`'s element type has an
      // UNRELATED property typed `RepresentativeValue | null` three levels down. A text-substring
      // version of this rule fired here; the whole `??` operand is an ARRAY of rich objects, never a
      // RepresentativeValue itself, so nothing here is ever `null` — only ever absent (`undefined`).
      name: 'VALID: ?? defaulting an array-of-objects whose element nests a RepresentativeValue property',
      code: `${CONTRACT_IMPORTS}
interface CallFact {
  args: { value: RepresentativeValue | null; kind: 'literal' }[];
  startLine: number;
}
declare const calls: CallFact[] | undefined;
const resolved = calls ?? [];
`,
    },
    {
      // REGRESSION LOCK. Reconstructs packages/core/src/guards/is-domain-empty/is-domain-empty-guard.ts:44
      // — `domain.members ?? []`. `domain.members` IS `RepresentativeValue[] | undefined` — an ARRAY of
      // the branded type — but the array itself is never `null` in this domain, only ever `undefined`
      // (no explicit members list). The bug this rule closes is a scalar RepresentativeValue/ArrangeValue
      // losing its `null`, not an array losing its absence.
      name: 'VALID: ?? defaulting a RepresentativeValue[] itself (the array is never null, only undefined)',
      code: `${CONTRACT_IMPORTS}
declare const domainMembers: RepresentativeValue[] | undefined;
const members = domainMembers ?? [];
`,
    },
    {
      // REGRESSION LOCK. Reconstructs packages/core/src/transformers/funnel-cases/
      // funnel-cases-transformer.ts:105 — `steered[0] ?? []`, where `steered: ArrangeValue[][]`.
      // `steered[0]` is `ArrangeValue[] | undefined` — an array of ArrangeValue, never itself null.
      name: 'VALID: ?? defaulting an ArrangeValue[] element (the array is never null, only undefined)',
      code: `${CONTRACT_IMPORTS}
declare const steered: ArrangeValue[][];
const first = steered[0] ?? [];
`,
    },
  ],
  invalid: [
    {
      // Reconstructs the FIRST of the three object-arrange-transformer.ts chains
      // (git show 20dc86c -- packages/core/src/transformers/object-arrange/object-arrange-transformer.ts):
      // `const value = usableValues[0] ?? fillValueTransformer({ type: property.type });`
      name: 'INVALID: object-arrange chain 1 — the unconstrained-property fill (fixed in 20dc86c)',
      code: `${CONTRACT_IMPORTS}
declare const usableValues: RepresentativeValue[];
declare function fillValueTransformer(): RepresentativeValue;
const value = usableValues[0] ?? fillValueTransformer();
`,
      errors: [{ messageId: 'discardsNull' }],
    },
    {
      // Reconstructs the SECOND chain, the corrected-property branch:
      // `usableValues.find((candidate) => isValueInDomainGuard({ value: candidate, domain })) ??
      //  usableValues[0] ?? fillValueTransformer({ type: property.type });`
      // Two `??` operators here, so two reports: the outer chain, and the inner `.find() ?? [0]` pair.
      name: 'INVALID: object-arrange chain 2 — the corrected-property fill (fixed in 20dc86c)',
      code: `${CONTRACT_IMPORTS}
declare const usableValues: RepresentativeValue[];
declare function isValueInDomainGuard(args: { value: RepresentativeValue }): boolean;
declare function fillValueTransformer(): RepresentativeValue;
const value =
  usableValues.find((candidate) => isValueInDomainGuard({ value: candidate })) ??
  usableValues[0] ??
  fillValueTransformer();
`,
      errors: [{ messageId: 'discardsNull' }, { messageId: 'discardsNull' }],
    },
    {
      // Reconstructs the THIRD chain, the uncorrected-property branch:
      // `const preferred = domain === undefined ? undefined : usableValues.find(...);`
      // `const value = preferred ?? realized[0] ?? fillValueTransformer({ type: property.type });`
      // `preferred` alone is RepresentativeValue|undefined (one report); `preferred ?? realized[0]` is
      // the outer chain (a second report).
      name: 'INVALID: object-arrange chain 3 — the uncorrected-property fill (fixed in 20dc86c)',
      code: `${CONTRACT_IMPORTS}
declare const domain: { members: RepresentativeValue[] } | undefined;
declare const usableValues: RepresentativeValue[];
declare const realized: RepresentativeValue[];
declare function isValueInDomainGuard(args: { value: RepresentativeValue }): boolean;
declare function fillValueTransformer(): ArrangeValue;
const preferred = domain === undefined ? undefined : usableValues.find((value) => isValueInDomainGuard({ value }));
const value = preferred ?? realized[0] ?? fillValueTransformer();
`,
      errors: [{ messageId: 'discardsNull' }, { messageId: 'discardsNull' }],
    },
    {
      // Reconstructs type-to-range-transformer.ts's `literalPoint` line
      // (git show 20dc86c -- packages/core/src/transformers/type-to-range/type-to-range-transformer.ts):
      // `const literalPoint = literal ?? rep;`
      name: 'INVALID: type-to-range literalPoint — literal ?? rep (fixed in 20dc86c)',
      code: `${CONTRACT_IMPORTS}
declare const literal: RepresentativeValue | undefined;
declare const rep: RepresentativeValue | undefined;
const literalPoint = literal ?? rep;
`,
      errors: [{ messageId: 'discardsNull' }],
    },
    {
      // Not one of the six historical fixes — a coverage case for the shape the brief states directly:
      // "the left operand's type IS ... RepresentativeValue", with no surrounding array or `| undefined`
      // at all. Confirmed by probing the checker directly: a bare `RepresentativeValue` reference is
      // ALREADY a union of four branded intersections plus `null` (RepresentativeValue's own definition),
      // so this exercises the same branded-intersection constituent check as every other case, without
      // an array or an optional binding contributing the union.
      name: 'INVALID: a bare, non-optional RepresentativeValue operand',
      code: `${CONTRACT_IMPORTS}
declare const x: RepresentativeValue;
declare const y: RepresentativeValue;
const value = x ?? y;
`,
      errors: [{ messageId: 'discardsNull' }],
    },
    {
      // The ArrangeValue twin of the case above: bare, non-optional, no array wrapper.
      name: 'INVALID: a bare, non-optional ArrangeValue operand',
      code: `${CONTRACT_IMPORTS}
declare const a: ArrangeValue;
declare const b: ArrangeValue;
const value = a ?? b;
`,
      errors: [{ messageId: 'discardsNull' }],
    },
  ],
});
