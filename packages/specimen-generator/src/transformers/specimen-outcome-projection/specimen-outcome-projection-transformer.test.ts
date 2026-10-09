import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';
import { CaseResultStub } from '@assayer/shared/contracts/case-result/case-result.stub';
import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';
import { DarkSpotStub } from '@assayer/shared/contracts/dark-spot/dark-spot.stub';
import { EntryGapStub } from '@assayer/shared/contracts/entry-gap/entry-gap.stub';
import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';
import { FunctionAnalysisStub } from '@assayer/shared/contracts/function-analysis/function-analysis.stub';
import { LintEntryStub } from '@assayer/shared/contracts/lint-entry/lint-entry.stub';
import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';
import { TraceEventStub } from '@assayer/shared/contracts/trace-event/trace-event.stub';
import { UndrivenEntryStub } from '@assayer/shared/contracts/undriven-entry/undriven-entry.stub';

import { SpecimenOutcomeStub } from '../../contracts/specimen-outcome/specimen-outcome.stub';
import { specimenOutcomeProjectionTransformer } from './specimen-outcome-projection-transformer';

describe('specimenOutcomeProjectionTransformer', () => {
  describe('branches', () => {
    it('VALID: {leaf seen true and false in passed cases} => driven both-ways', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/if:a',
                kind: 'if',
                startLine: 2,
                endLine: 4,
                condition: ConditionLeafStub({ id: 'f/if:a#leaf' }),
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({
        cases: [
          CaseResultStub({ trace: [TraceEventStub({ id: 'f/if:a#leaf', kind: 'cond', outcome: true })] }),
          CaseResultStub({ trace: [TraceEventStub({ id: 'f/if:a#leaf', kind: 'cond', outcome: false })] }),
        ],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(
        SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'both-ways' }] }),
      );
    });

    it('VALID: {leaf seen only true, twice} => driven one-way', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/if:a',
                kind: 'ternary',
                startLine: 5,
                endLine: 5,
                condition: ConditionLeafStub({ id: 'f/if:a#leaf' }),
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({
        cases: [
          CaseResultStub({ trace: [TraceEventStub({ id: 'f/if:a#leaf', kind: 'cond', outcome: true })] }),
          CaseResultStub({ trace: [TraceEventStub({ id: 'f/if:a#leaf', kind: 'cond', outcome: true })] }),
        ],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(
        SpecimenOutcomeStub({ branches: [{ kind: 'ternary', line: 5, driven: 'one-way' }] }),
      );
    });

    it('VALID: {leaf seen only false} => driven one-way', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/if:a',
                kind: 'if',
                startLine: 2,
                endLine: 4,
                condition: ConditionLeafStub({ id: 'f/if:a#leaf' }),
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({
        cases: [CaseResultStub({ trace: [TraceEventStub({ id: 'f/if:a#leaf', kind: 'cond', outcome: false })] })],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'one-way' }] }));
    });

    it('EMPTY: {no cases at all} => driven never', () => {
      const analysis = FileAnalysisStub();
      const run = RunResultStub({ cases: [] });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'never' }] }));
    });

    it('VALID: {only a failed case evaluated the leaf both ways} => driven never', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/if:a',
                kind: 'if',
                startLine: 2,
                endLine: 4,
                condition: ConditionLeafStub({ id: 'f/if:a#leaf' }),
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'failed',
            trace: [
              TraceEventStub({ id: 'f/if:a#leaf', kind: 'cond', outcome: true }),
              TraceEventStub({ id: 'f/if:a#leaf', kind: 'cond', outcome: false }),
            ],
          }),
        ],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(
        SpecimenOutcomeStub({
          branches: [{ kind: 'if', line: 2, driven: 'never' }],
          caseFailures: [{ status: 'failed', message: '' }],
        }),
      );
    });

    it('VALID: {trace holds an exit event and a cond event with another id} => driven never', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/if:a',
                kind: 'if',
                startLine: 2,
                endLine: 4,
                condition: ConditionLeafStub({ id: 'f/if:a#leaf' }),
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            trace: [
              TraceEventStub({ id: 'f/if:a#leaf', kind: 'exit', outcome: true }),
              TraceEventStub({ id: 'f/if:a#leaf.0', kind: 'cond', outcome: true }),
            ],
          }),
        ],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'never' }] }));
    });

    it('VALID: {and branch whose leaves each saw one different outcome} => driven both-ways', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/if:ab',
                kind: 'if',
                startLine: 3,
                endLine: 5,
                condition: {
                  kind: 'and',
                  left: ConditionLeafStub({ id: 'f/if:ab#leaf.0' }),
                  right: ConditionLeafStub({ id: 'f/if:ab#leaf.1' }),
                },
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            trace: [
              TraceEventStub({ id: 'f/if:ab#leaf.0', kind: 'cond', outcome: true }),
              TraceEventStub({ id: 'f/if:ab#leaf.1', kind: 'cond', outcome: false }),
            ],
          }),
        ],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 3, driven: 'both-ways' }] }));
    });

    it('VALID: {or branch under a not, only the inner right leaf evaluated true} => driven one-way', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/if:nor',
                kind: 'if',
                startLine: 3,
                endLine: 5,
                condition: {
                  kind: 'not',
                  operand: {
                    kind: 'or',
                    left: ConditionLeafStub({ id: 'f/if:nor#leaf.0' }),
                    right: ConditionLeafStub({ id: 'f/if:nor#leaf.1' }),
                  },
                },
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({
        cases: [CaseResultStub({ trace: [TraceEventStub({ id: 'f/if:nor#leaf.1', kind: 'cond', outcome: true })] })],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 3, driven: 'one-way' }] }));
    });

    it('VALID: {two branches listed out of line order} => rows sorted by line', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/if:late',
                kind: 'ternary',
                startLine: 9,
                endLine: 9,
                condition: ConditionLeafStub({ id: 'f/if:late#leaf' }),
              }),
              BranchNodeStub({
                coverageId: 'f/if:early',
                kind: 'if',
                startLine: 2,
                endLine: 4,
                condition: ConditionLeafStub({ id: 'f/if:early#leaf' }),
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({
        cases: [CaseResultStub({ trace: [TraceEventStub({ id: 'f/if:late#leaf', kind: 'cond', outcome: true })] })],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(
        SpecimenOutcomeStub({
          branches: [
            { kind: 'if', line: 2, driven: 'never' },
            { kind: 'ternary', line: 9, driven: 'one-way' },
          ],
        }),
      );
    });

    it('EDGE: {two branches on one line} => rows sorted by kind', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            branches: [
              BranchNodeStub({
                coverageId: 'f/ternary',
                kind: 'ternary',
                startLine: 4,
                endLine: 4,
                condition: ConditionLeafStub({ id: 'f/ternary#leaf' }),
              }),
              BranchNodeStub({
                coverageId: 'f/if',
                kind: 'if',
                startLine: 4,
                endLine: 4,
                condition: ConditionLeafStub({ id: 'f/if#leaf' }),
              }),
            ],
          }),
        ],
      });
      const run = RunResultStub({ cases: [] });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(
        SpecimenOutcomeStub({
          branches: [
            { kind: 'if', line: 4, driven: 'never' },
            { kind: 'ternary', line: 4, driven: 'never' },
          ],
        }),
      );
    });

    it('VALID: {same coverageId under two functions} => one row', () => {
      const branch = BranchNodeStub({
        coverageId: 'f/if:a',
        kind: 'if',
        startLine: 2,
        endLine: 4,
        condition: ConditionLeafStub({ id: 'f/if:a#leaf' }),
      });
      const analysis = FileAnalysisStub({
        functions: [FunctionAnalysisStub({ branches: [branch] }), FunctionAnalysisStub({ branches: [branch] })],
      });
      const run = RunResultStub({
        cases: [CaseResultStub({ trace: [TraceEventStub({ id: 'f/if:a#leaf', kind: 'cond', outcome: true })] })],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'one-way' }] }));
    });

    it('EMPTY: {functions without branches} => no branch rows', () => {
      const analysis = FileAnalysisStub({ functions: [FunctionAnalysisStub({ branches: [] })] });
      const run = RunResultStub({ cases: [] });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [] }));
    });

    it('VALID: {a branch only in a scope, no function holds it} => one row driven never', () => {
      const analysis = FileAnalysisStub({ functions: [] });
      const run = RunResultStub({ cases: [] });
      const scopeBranches = [
        BranchNodeStub({
          coverageId: 'iife/if:a',
          kind: 'if',
          startLine: 2,
          endLine: 4,
          condition: ConditionLeafStub({ id: 'iife/if:a#leaf' }),
        }),
      ];

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'never' }] }));
    });

    it('VALID: {a scope branch whose leaf a passed case saw true} => the row reads one-way through the leaf id', () => {
      const analysis = FileAnalysisStub({ functions: [] });
      const run = RunResultStub({
        cases: [CaseResultStub({ trace: [TraceEventStub({ id: 'iife/if:a#leaf', kind: 'cond', outcome: true })] })],
      });
      const scopeBranches = [
        BranchNodeStub({
          coverageId: 'iife/if:a',
          kind: 'if',
          startLine: 2,
          endLine: 4,
          condition: ConditionLeafStub({ id: 'iife/if:a#leaf' }),
        }),
      ];

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'one-way' }] }));
    });

    it('VALID: {the same coverageId in a function and in a scope} => one row', () => {
      const branch = BranchNodeStub({
        coverageId: 'f/if:a',
        kind: 'if',
        startLine: 2,
        endLine: 4,
        condition: ConditionLeafStub({ id: 'f/if:a#leaf' }),
      });
      const analysis = FileAnalysisStub({ functions: [FunctionAnalysisStub({ branches: [branch] })] });
      const run = RunResultStub({ cases: [] });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [branch] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'never' }] }));
    });
  });

  describe('caseFailures', () => {
    it('VALID: {failed, passed, errored cases} => failed and errored rows in run order', () => {
      const analysis = FileAnalysisStub({ functions: [] });
      const run = RunResultStub({
        cases: [
          CaseResultStub({ status: 'errored', message: 'threw TypeError' }),
          CaseResultStub({ status: 'passed' }),
          CaseResultStub({ status: 'failed' }),
        ],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(
        SpecimenOutcomeStub({
          branches: [],
          caseFailures: [
            { status: 'errored', message: 'threw TypeError' },
            { status: 'failed', message: '' },
          ],
        }),
      );
    });
  });

  describe('admission channels', () => {
    it('VALID: {lints out of order} => sorted by startLine then rule', () => {
      const analysis = FileAnalysisStub({ functions: [] });
      const run = RunResultStub({
        cases: [],
        lints: [
          LintEntryStub({ rule: 'unreachable-exit', startLine: 8 }),
          LintEntryStub({ rule: 'unreachable-exit', startLine: 3 }),
          LintEntryStub({ rule: 'dead-surface', startLine: 8 }),
        ],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(
        SpecimenOutcomeStub({
          branches: [],
          lints: [
            { rule: 'unreachable-exit', startLine: 3 },
            { rule: 'dead-surface', startLine: 8 },
            { rule: 'unreachable-exit', startLine: 8 },
          ],
        }),
      );
    });

    it('VALID: {undriven entries out of order} => startLines sorted', () => {
      const analysis = FileAnalysisStub({ functions: [] });
      const run = RunResultStub({
        cases: [],
        undriven: [UndrivenEntryStub({ startLine: 6 }), UndrivenEntryStub({ startLine: 1 })],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [], undriven: [{ startLine: 1 }, { startLine: 6 }] }));
    });

    it('VALID: {dark spots out of order} => startLines sorted', () => {
      const analysis = FileAnalysisStub({ functions: [] });
      const run = RunResultStub({
        cases: [],
        darkSpots: [DarkSpotStub({ startLine: 7 }), DarkSpotStub({ startLine: 3 })],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [], darkSpots: [{ startLine: 3 }, { startLine: 7 }] }));
    });

    it('VALID: {gaps out of order} => names sorted', () => {
      const analysis = FileAnalysisStub({ functions: [] });
      const run = RunResultStub({
        cases: [],
        gaps: [EntryGapStub({ name: 'zeta' }), EntryGapStub({ name: 'alpha' })],
      });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(SpecimenOutcomeStub({ branches: [], gaps: [{ name: 'alpha' }, { name: 'zeta' }] }));
    });
  });

  describe('empty file', () => {
    it('EMPTY: {no functions, no cases, no admissions} => every list empty', () => {
      const analysis = FileAnalysisStub({ functions: [] });
      const run = RunResultStub({ cases: [] });

      const result = specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches: [] });

      expect(result).toStrictEqual(
        SpecimenOutcomeStub({
          branches: [],
          caseFailures: [],
          lints: [],
          undriven: [],
          darkSpots: [],
          gaps: [],
        }),
      );
    });
  });
});
