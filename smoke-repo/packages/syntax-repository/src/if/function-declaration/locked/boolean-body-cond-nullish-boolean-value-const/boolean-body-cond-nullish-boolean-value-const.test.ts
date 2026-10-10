import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-body-cond-nullish-boolean-value-const', () => {
    it('VALID: {value: const} => if on line 24 locked one way, unreachable-exit on line 27, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/function-declaration/locked/boolean-body-cond-nullish-boolean-value-const/boolean-body-cond-nullish-boolean-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 24, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 27 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
