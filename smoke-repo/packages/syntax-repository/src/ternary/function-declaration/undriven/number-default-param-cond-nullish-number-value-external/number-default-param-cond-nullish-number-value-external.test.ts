import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-default-param-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => ternary on line 23 locked one way; ternary on line 23 locked one way, undriven from line 23, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/undriven/number-default-param-cond-nullish-number-value-external/number-default-param-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 23, driven: 'one-way' }, { kind: 'ternary', line: 23, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 23 }, { startLine: 23 }],
            darkSpots: [],
            gaps: []
        });
    });
});
