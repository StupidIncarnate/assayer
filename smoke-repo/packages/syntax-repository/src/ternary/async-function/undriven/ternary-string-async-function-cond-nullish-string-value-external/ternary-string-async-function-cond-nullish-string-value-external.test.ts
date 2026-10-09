import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-string-async-function-cond-nullish-string-value-external', () => {
    it('VALID: {value: external} => ternary on line 3 never run; ternary on line 3 never run, undriven from line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/async-function/undriven/ternary-string-async-function-cond-nullish-string-value-external/ternary-string-async-function-cond-nullish-string-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 3, driven: 'never' }, { kind: 'ternary', line: 3, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 3 }, { startLine: 3 }],
            darkSpots: [],
            gaps: []
        });
    });
});
