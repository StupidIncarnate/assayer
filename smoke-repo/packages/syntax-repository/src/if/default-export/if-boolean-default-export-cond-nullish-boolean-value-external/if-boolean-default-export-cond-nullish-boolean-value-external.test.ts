import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-boolean-default-export-cond-nullish-boolean-value-external', () => {
    it('VALID: {value: external} => if on line 2 never run; ternary on line 2 never run, undriven from line 2, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/default-export/if-boolean-default-export-cond-nullish-boolean-value-external/if-boolean-default-export-cond-nullish-boolean-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 2, driven: 'never' }, { kind: 'ternary', line: 2, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 2 }],
            darkSpots: [],
            gaps: []
        });
    });
});
