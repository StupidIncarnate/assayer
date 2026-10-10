import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-expression-body-cond-string-length-receiver-param', () => {
    it('VALID: {receiver: param} => ternary then on line 22 driven; ternary else on line 22 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/arrow-function/driven/number-expression-body-cond-string-length-receiver-param/number-expression-body-cond-string-length-receiver-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 22, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 22, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
