import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-method-cond-eq-boolean-value-const', () => {
    it('VALID: {value: const} => ternary then on line 26 never run; ternary else on line 26 driven, unreachable-exit on line 26, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/locked/boolean-method-cond-eq-boolean-value-const/boolean-method-cond-eq-boolean-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 26, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'driven' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 26 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
