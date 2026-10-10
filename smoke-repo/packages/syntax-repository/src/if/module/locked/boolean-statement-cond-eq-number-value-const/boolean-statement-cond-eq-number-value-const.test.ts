import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-statement-cond-eq-number-value-const', () => {
    it('VALID: {value: const} => if on line 23 locked one way, unreachable-exit on line 24, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/locked/boolean-statement-cond-eq-number-value-const/boolean-statement-cond-eq-number-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 23, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 24 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
