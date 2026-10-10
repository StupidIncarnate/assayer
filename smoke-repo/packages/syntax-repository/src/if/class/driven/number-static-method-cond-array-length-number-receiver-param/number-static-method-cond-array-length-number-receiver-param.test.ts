import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-static-method-cond-array-length-number-receiver-param', () => {
    it('VALID: {receiver: param} => if then on line 24 driven; if else on line 24 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/driven/number-static-method-cond-array-length-number-receiver-param/number-static-method-cond-array-length-number-receiver-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 24, driven: 'driven' }, { kind: 'if', arm: 'else', line: 24, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
