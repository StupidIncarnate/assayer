import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('string-cond-nullish-string-value-external', () => {
    it('VALID: {value: external} => ternary then on line 26 never run; ternary then on line 26 never run; ternary else on line 26 driven; ternary else on line 26 never run, undriven from line 26, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/generator-function/undriven/string-cond-nullish-string-value-external/string-cond-nullish-string-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 26, driven: 'never' }, { kind: 'ternary', arm: 'then', line: 26, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 26 }, { startLine: 26 }],
            darkSpots: [],
            gaps: []
        });
    });
});
