import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-exported-const-cond-nullish-boolean-value-const', () => {
    it('VALID: {value: const} => ternary on line 23 locked one way, unreachable-exit on line 23, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/module/locked/boolean-exported-const-cond-nullish-boolean-value-const/boolean-exported-const-cond-nullish-boolean-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 23, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 23 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
