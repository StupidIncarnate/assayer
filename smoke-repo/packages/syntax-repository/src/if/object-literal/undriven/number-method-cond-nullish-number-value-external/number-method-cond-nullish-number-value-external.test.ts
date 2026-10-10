import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-method-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => if on line 25 never run; ternary on line 25 never run, undriven from line 25, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/object-literal/undriven/number-method-cond-nullish-number-value-external/number-method-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 25, driven: 'never' }, { kind: 'ternary', line: 25, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 25 }, { startLine: 25 }],
            darkSpots: [],
            gaps: []
        });
    });
});
