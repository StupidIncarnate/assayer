import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-cond-param', () => {
    it('VALID: {cond: param} => ternary then on line 23 driven; ternary else on line 23 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/default-export/driven/boolean-cond-param/boolean-cond-param.ts'
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
