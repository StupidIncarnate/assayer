import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-function-declaration-default-param-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => ternary on line 1 locked one way; ternary on line 1 locked one way, undriven from line 1, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/undriven/ternary-number-function-declaration-default-param-cond-nullish-number-value-external/ternary-number-function-declaration-default-param-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 1, driven: 'one-way' }, { kind: 'ternary', line: 1, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 1 }, { startLine: 1 }],
            darkSpots: [],
            gaps: []
        });
    });
});
