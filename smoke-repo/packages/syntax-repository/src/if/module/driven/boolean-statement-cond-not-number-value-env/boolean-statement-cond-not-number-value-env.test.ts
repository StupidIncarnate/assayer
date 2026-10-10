import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-statement-cond-not-number-value-env', () => {
    it('VALID: {value: env} => if then on line 24 driven; if else on line 24 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/driven/boolean-statement-cond-not-number-value-env/boolean-statement-cond-not-number-value-env.ts'
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
