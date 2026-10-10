import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('string-constructor-body-cond-nullish-string-value-const', () => {
    it('VALID: {value: const} => if then on line 26 driven; if else on line 26 never run, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/locked/string-constructor-body-cond-nullish-string-value-const/string-constructor-body-cond-nullish-string-value-const.ts'
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
