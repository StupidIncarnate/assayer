import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-boolean-object-literal-arrow-property-cond-external', () => {
    it('VALID: {cond: external} => ternary on line 3 never run, undriven from line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/object-literal/ternary-boolean-object-literal-arrow-property-cond-external/ternary-boolean-object-literal-arrow-property-cond-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 3, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 3 }],
            darkSpots: [],
            gaps: []
        });
    });
});
