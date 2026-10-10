import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('string-arrow-property-cond-nullish-string-value-external', () => {
    it('VALID: {value: external} => ternary then on line 27 never run; ternary then on line 27 never run; ternary else on line 27 never run; ternary else on line 27 never run, undriven from line 27, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/object-literal/undriven/string-arrow-property-cond-nullish-string-value-external/string-arrow-property-cond-nullish-string-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 27, driven: 'never' }, { kind: 'ternary', arm: 'then', line: 27, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 27, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 27, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 27 }, { startLine: 27 }],
            darkSpots: [],
            gaps: []
        });
    });
});
