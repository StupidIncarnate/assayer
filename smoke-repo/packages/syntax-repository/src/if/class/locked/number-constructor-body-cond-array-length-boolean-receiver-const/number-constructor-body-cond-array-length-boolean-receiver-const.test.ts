import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-constructor-body-cond-array-length-boolean-receiver-const', () => {
    it('VALID: {receiver: const} => if then on line 26 driven; if else on line 26 never run, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/locked/number-constructor-body-cond-array-length-boolean-receiver-const/number-constructor-body-cond-array-length-boolean-receiver-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 26, driven: 'driven' }, { kind: 'if', arm: 'else', line: 26, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
