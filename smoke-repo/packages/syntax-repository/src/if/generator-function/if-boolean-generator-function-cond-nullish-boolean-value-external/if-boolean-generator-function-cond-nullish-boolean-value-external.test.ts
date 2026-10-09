import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-boolean-generator-function-cond-nullish-boolean-value-external', () => {
    it('VALID: {value: external} => if on line 2 never run; ternary on line 2 never run, undriven from line 1, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/generator-function/if-boolean-generator-function-cond-nullish-boolean-value-external/if-boolean-generator-function-cond-nullish-boolean-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 2, driven: 'never' }, { kind: 'ternary', line: 2, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 1 }],
            darkSpots: [],
            gaps: []
        });
    });
});
