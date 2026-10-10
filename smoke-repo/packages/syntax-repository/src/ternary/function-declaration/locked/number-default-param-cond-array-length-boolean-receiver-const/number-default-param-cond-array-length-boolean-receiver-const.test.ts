import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-default-param-cond-array-length-boolean-receiver-const', () => {
    it('VALID: {receiver: const} => ternary then on line 24 driven; ternary else on line 24 never run, unreachable-exit on line 24, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/locked/number-default-param-cond-array-length-boolean-receiver-const/number-default-param-cond-array-length-boolean-receiver-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 24, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 24, driven: 'never' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 24 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
