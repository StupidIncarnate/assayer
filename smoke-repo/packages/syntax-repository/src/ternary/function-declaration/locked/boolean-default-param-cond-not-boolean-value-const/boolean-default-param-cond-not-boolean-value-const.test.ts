import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-default-param-cond-not-boolean-value-const', () => {
    it('VALID: {value: const} => ternary then on line 24 never run; ternary else on line 24 driven, unreachable-exit on line 24, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/locked/boolean-default-param-cond-not-boolean-value-const/boolean-default-param-cond-not-boolean-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 24, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 24, driven: 'driven' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 24 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
