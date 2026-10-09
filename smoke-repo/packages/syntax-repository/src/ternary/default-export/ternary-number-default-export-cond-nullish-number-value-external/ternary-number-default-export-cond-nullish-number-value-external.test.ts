import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-default-export-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => ternary on line 2 never run; ternary on line 2 never run, undriven from line 2, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/default-export/ternary-number-default-export-cond-nullish-number-value-external/ternary-number-default-export-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 2, driven: 'never' }, { kind: 'ternary', line: 2, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 2 }],
            darkSpots: [],
            gaps: []
        });
    });
});
