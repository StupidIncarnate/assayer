import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-cond-eq-string-value-const', () => {
    it('VALID: {value: const} => ternary then on line 25 never run; ternary else on line 25 driven, unreachable-exit on line 25, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-expression/locked/boolean-cond-eq-string-value-const/boolean-cond-eq-string-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 25, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 25, driven: 'driven' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 25 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
