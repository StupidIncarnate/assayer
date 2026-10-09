import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-string-generator-function-cond-nullish-string-value-external', () => {
    it('VALID: {value: external} => ternary on line 2 locked one way; ternary on line 2 locked one way, undriven from line 2, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/generator-function/undriven/ternary-string-generator-function-cond-nullish-string-value-external/ternary-string-generator-function-cond-nullish-string-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 2, driven: 'one-way' }, { kind: 'ternary', line: 2, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 2 }, { startLine: 2 }],
            darkSpots: [],
            gaps: []
        });
    });
});
