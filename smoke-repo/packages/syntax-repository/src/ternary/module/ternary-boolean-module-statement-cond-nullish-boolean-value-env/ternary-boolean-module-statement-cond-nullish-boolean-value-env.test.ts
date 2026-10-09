import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-boolean-module-statement-cond-nullish-boolean-value-env', () => {
    it('VALID: {value: env} => ternary on line 1 driven both ways; ternary on line 3 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/module/ternary-boolean-module-statement-cond-nullish-boolean-value-env/ternary-boolean-module-statement-cond-nullish-boolean-value-env.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 1, driven: 'both-ways' }, { kind: 'ternary', line: 3, driven: 'both-ways' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
