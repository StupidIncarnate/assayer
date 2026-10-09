import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-boolean-async-function-cond-nullish-boolean-value-external', () => {
    it('VALID: {value: external} => if on line 3 never run; ternary on line 3 never run, undriven from line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/async-function/undriven/if-boolean-async-function-cond-nullish-boolean-value-external/if-boolean-async-function-cond-nullish-boolean-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 3, driven: 'never' }, { kind: 'ternary', line: 3, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 3 }, { startLine: 3 }],
            darkSpots: [],
            gaps: []
        });
    });
});
