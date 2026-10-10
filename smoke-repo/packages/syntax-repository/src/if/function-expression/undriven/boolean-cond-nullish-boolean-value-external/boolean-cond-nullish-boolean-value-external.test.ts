import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-cond-nullish-boolean-value-external', () => {
    it('VALID: {value: external} => if on line 24 never run; ternary on line 24 never run, undriven from line 24, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/function-expression/undriven/boolean-cond-nullish-boolean-value-external/boolean-cond-nullish-boolean-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 24, driven: 'never' }, { kind: 'ternary', line: 24, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 24 }, { startLine: 24 }],
            darkSpots: [],
            gaps: []
        });
    });
});
