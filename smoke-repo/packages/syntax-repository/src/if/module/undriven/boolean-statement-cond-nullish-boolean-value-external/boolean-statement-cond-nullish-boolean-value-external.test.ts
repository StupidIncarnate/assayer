import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-statement-cond-nullish-boolean-value-external', () => {
    it('VALID: {value: external} => if on line 23 locked one way; ternary on line 23 locked one way, undriven from line 23, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/undriven/boolean-statement-cond-nullish-boolean-value-external/boolean-statement-cond-nullish-boolean-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 23, driven: 'one-way' }, { kind: 'ternary', line: 23, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 23 }, { startLine: 23 }],
            darkSpots: [],
            gaps: []
        });
    });
});
