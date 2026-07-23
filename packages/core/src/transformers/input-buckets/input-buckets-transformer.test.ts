import { BranchNodeStub, ConditionNodeStub } from '@assayer/shared/contracts';

import { inputBucketsTransformer } from './input-buckets-transformer';

const A_BRANCH = BranchNodeStub({
  coverageId: 'f/if:a',
  condition: {
    kind: 'leaf',
    id: 'f/if:a#leaf',
    operandParamName: 'a',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
  },
});

const B_BRANCH = BranchNodeStub({
  coverageId: 'f/if:b',
  condition: {
    kind: 'leaf',
    id: 'f/if:b#leaf',
    operandParamName: 'b',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 1 },
  },
});

const AND_BRANCH = BranchNodeStub({
  coverageId: 'g/if:and',
  condition: {
    kind: 'and',
    left: {
      kind: 'leaf',
      id: 'g/if:and#leaf.0',
      operandParamName: 'score',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 5 },
    },
    right: {
      kind: 'leaf',
      id: 'g/if:and#leaf.1',
      operandParamName: 'bonus',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 1 },
    },
  },
});

const PREDICATE = ConditionNodeStub();

// The compound and predicate cases are projected once at module scope so the assertions stay a single
// map deep — keeping each `it` under the nesting ceiling while still asserting the whole shape.
const COMPOUND = inputBucketsTransformer({ branches: [AND_BRANCH] }).map((bucket) => ({
  arms: bucket.arms.map((step) => String(step.arm)),
  leafWants: bucket.requirements.map((req) => ({ id: String(req.leaf.id), want: req.want })),
}));

const PREDICATE_ONLY = inputBucketsTransformer({ branches: [], returnPredicate: PREDICATE }).map((bucket) => ({
  arms: bucket.arms,
  leafWants: bucket.requirements.map((req) => ({ want: req.want })),
  predWant: bucket.predWant,
}));

const BRANCH_AND_PREDICATE = inputBucketsTransformer({ branches: [A_BRANCH], returnPredicate: PREDICATE }).map((bucket) => ({
  arms: bucket.arms.map((step) => String(step.arm)),
  predWant: bucket.predWant,
}));

describe('inputBucketsTransformer', () => {
  it('EMPTY: {no branches, no predicate} => one empty bucket', () => {
    expect(inputBucketsTransformer({ branches: [] })).toStrictEqual([{ requirements: [], arms: [] }]);
  });

  it('VALID: {a single leaf branch} => a then bucket and an else bucket', () => {
    expect(inputBucketsTransformer({ branches: [A_BRANCH] })).toStrictEqual([
      { requirements: [{ leaf: A_BRANCH.condition, want: true }], arms: [{ branchCoverageId: 'f/if:a', arm: 'then' }] },
      { requirements: [{ leaf: A_BRANCH.condition, want: false }], arms: [{ branchCoverageId: 'f/if:a', arm: 'else' }] },
    ]);
  });

  it('VALID: {two single-leaf branches} => the four-bucket cross product', () => {
    expect(inputBucketsTransformer({ branches: [A_BRANCH, B_BRANCH] })).toStrictEqual([
      {
        requirements: [
          { leaf: A_BRANCH.condition, want: true },
          { leaf: B_BRANCH.condition, want: true },
        ],
        arms: [
          { branchCoverageId: 'f/if:a', arm: 'then' },
          { branchCoverageId: 'f/if:b', arm: 'then' },
        ],
      },
      {
        requirements: [
          { leaf: A_BRANCH.condition, want: true },
          { leaf: B_BRANCH.condition, want: false },
        ],
        arms: [
          { branchCoverageId: 'f/if:a', arm: 'then' },
          { branchCoverageId: 'f/if:b', arm: 'else' },
        ],
      },
      {
        requirements: [
          { leaf: A_BRANCH.condition, want: false },
          { leaf: B_BRANCH.condition, want: true },
        ],
        arms: [
          { branchCoverageId: 'f/if:a', arm: 'else' },
          { branchCoverageId: 'f/if:b', arm: 'then' },
        ],
      },
      {
        requirements: [
          { leaf: A_BRANCH.condition, want: false },
          { leaf: B_BRANCH.condition, want: false },
        ],
        arms: [
          { branchCoverageId: 'f/if:a', arm: 'else' },
          { branchCoverageId: 'f/if:b', arm: 'else' },
        ],
      },
    ]);
  });

  it('VALID: {a && b} => then holds one way, else fans out per short-circuit reason', () => {
    expect(COMPOUND).toStrictEqual([
      {
        arms: ['then'],
        leafWants: [
          { id: 'g/if:and#leaf.0', want: true },
          { id: 'g/if:and#leaf.1', want: true },
        ],
      },
      { arms: ['else'], leafWants: [{ id: 'g/if:and#leaf.0', want: false }] },
      {
        arms: ['else'],
        leafWants: [
          { id: 'g/if:and#leaf.0', want: true },
          { id: 'g/if:and#leaf.1', want: false },
        ],
      },
    ]);
  });

  it('VALID: {a branchless predicate} => a true bucket and a false bucket, carrying no arm', () => {
    expect(PREDICATE_ONLY).toStrictEqual([
      { arms: [], leafWants: [{ want: true }], predWant: true },
      { arms: [], leafWants: [{ want: false }], predWant: false },
    ]);
  });

  it('VALID: {one branch and a predicate} => the branch arms crossed with the predicate true/false', () => {
    expect(BRANCH_AND_PREDICATE).toStrictEqual([
      { arms: ['then'], predWant: true },
      { arms: ['then'], predWant: false },
      { arms: ['else'], predWant: true },
      { arms: ['else'], predWant: false },
    ]);
  });
});
