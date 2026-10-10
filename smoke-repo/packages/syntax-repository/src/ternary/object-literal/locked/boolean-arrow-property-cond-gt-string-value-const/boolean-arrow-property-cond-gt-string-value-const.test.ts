import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-arrow-property-cond-gt-string-value-const', () => {
    it('VALID: {value: const} => ternary then on line 26 never run; ternary else on line 26 driven, unreachable-exit on line 26, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/object-literal/locked/boolean-arrow-property-cond-gt-string-value-const/boolean-arrow-property-cond-gt-string-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 26, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'driven' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 26 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
