import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-statement-cond-array-length-number-receiver-const', () => {
    it('VALID: {receiver: const} => if then on line 24 driven; if else on line 24 never run, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/locked/number-statement-cond-array-length-number-receiver-const/number-statement-cond-array-length-number-receiver-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 24, driven: 'driven' }, { kind: 'if', arm: 'else', line: 24, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
