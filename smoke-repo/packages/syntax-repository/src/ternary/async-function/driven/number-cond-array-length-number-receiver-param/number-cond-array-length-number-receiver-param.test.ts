import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-cond-array-length-number-receiver-param', () => {
    it('VALID: {receiver: param} => ternary then on line 24 driven; ternary else on line 24 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/async-function/driven/number-cond-array-length-number-receiver-param/number-cond-array-length-number-receiver-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 24, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 24, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
