import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('string-static-field-cond-nullish-string-value-env', () => {
    it('VALID: {value: env} => ternary on line 22 driven both ways; ternary on line 25 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/driven/string-static-field-cond-nullish-string-value-env/string-static-field-cond-nullish-string-value-env.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 22, driven: 'both-ways' }, { kind: 'ternary', line: 25, driven: 'both-ways' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
