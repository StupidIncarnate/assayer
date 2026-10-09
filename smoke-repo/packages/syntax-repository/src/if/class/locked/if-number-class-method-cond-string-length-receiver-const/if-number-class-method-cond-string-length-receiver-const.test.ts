import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-class-method-cond-string-length-receiver-const', () => {
    it('VALID: {receiver: const} => if on line 5 locked one way, unreachable-exit on line 8, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/locked/if-number-class-method-cond-string-length-receiver-const/if-number-class-method-cond-string-length-receiver-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 5, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 8 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
