import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-body-cond-eq-string-value-external', () => {
    it('VALID: {value: external} => if then on line 23 never run; if else on line 23 never run, undriven from line 23, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/function-declaration/undriven/boolean-body-cond-eq-string-value-external/boolean-body-cond-eq-string-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 23, driven: 'never' }, { kind: 'if', arm: 'else', line: 23, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 23 }],
            darkSpots: [],
            gaps: []
        });
    });
});
