import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-block-body-cond-nullish-boolean-value-external', () => {
    it('VALID: {value: external} => if then on line 26 never run; if else on line 26 driven; ternary then on line 26 never run; ternary else on line 26 never run, undriven from line 26, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/arrow-function/undriven/boolean-block-body-cond-nullish-boolean-value-external/boolean-block-body-cond-nullish-boolean-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 26, driven: 'never' }, { kind: 'if', arm: 'else', line: 26, driven: 'driven' }, { kind: 'ternary', arm: 'then', line: 26, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 26 }, { startLine: 26 }],
            darkSpots: [],
            gaps: []
        });
    });
});
