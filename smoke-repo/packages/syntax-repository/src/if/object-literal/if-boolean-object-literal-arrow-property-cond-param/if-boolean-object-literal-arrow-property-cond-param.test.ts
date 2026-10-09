import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-boolean-object-literal-arrow-property-cond-param', () => {
    it('VALID: {cond: param} => if on line 3 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/object-literal/if-boolean-object-literal-arrow-property-cond-param/if-boolean-object-literal-arrow-property-cond-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 3, driven: 'both-ways' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
