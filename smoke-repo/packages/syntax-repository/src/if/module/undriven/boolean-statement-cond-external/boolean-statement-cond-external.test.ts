import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-statement-cond-external', () => {
    it('VALID: {cond: external} => if then on line 22 never run; if else on line 22 never run, undriven from line 22, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/undriven/boolean-statement-cond-external/boolean-statement-cond-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 22, driven: 'never' }, { kind: 'if', arm: 'else', line: 22, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 22 }],
            darkSpots: [],
            gaps: []
        });
    });
});
