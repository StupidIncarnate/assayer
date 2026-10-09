import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-object-literal-method-cond-string-length-receiver-param', () => {
    it('VALID: {receiver: param} => if on line 3 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/object-literal/if-number-object-literal-method-cond-string-length-receiver-param/if-number-object-literal-method-cond-string-length-receiver-param.ts'
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
