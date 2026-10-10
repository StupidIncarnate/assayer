import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-cond-string-length-receiver-env', () => {
    it('VALID: {receiver: env} => ternary then on line 25 driven; ternary else on line 25 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/iife/driven/number-cond-string-length-receiver-env/number-cond-string-length-receiver-env.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 25, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 25, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
