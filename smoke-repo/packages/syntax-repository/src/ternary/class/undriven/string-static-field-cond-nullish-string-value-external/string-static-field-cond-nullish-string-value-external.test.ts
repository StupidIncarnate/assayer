import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('string-static-field-cond-nullish-string-value-external', () => {
    it('VALID: {value: external} => ternary on line 24 locked one way; ternary on line 24 locked one way, undriven from line 24, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/undriven/string-static-field-cond-nullish-string-value-external/string-static-field-cond-nullish-string-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 24, driven: 'one-way' }, { kind: 'ternary', line: 24, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 24 }, { startLine: 24 }],
            darkSpots: [],
            gaps: []
        });
    });
});
