import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-boolean-module-statement-cond-gt-string-value-const', () => {
    it('VALID: {value: const} => if on line 3 locked one way, unreachable-exit on line 4, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/locked/if-boolean-module-statement-cond-gt-string-value-const/if-boolean-module-statement-cond-gt-string-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 3, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 4 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
