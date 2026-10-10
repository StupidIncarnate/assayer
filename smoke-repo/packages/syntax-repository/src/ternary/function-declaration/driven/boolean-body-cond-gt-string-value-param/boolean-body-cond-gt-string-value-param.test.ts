import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-body-cond-gt-string-value-param', () => {
    it('VALID: {value: param} => ternary then on line 23 driven; ternary else on line 23 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/driven/boolean-body-cond-gt-string-value-param/boolean-body-cond-gt-string-value-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 23, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 23, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
