import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-cond-gt-string-value-param', () => {
    it('VALID: {value: param} => if then on line 23 driven; if else on line 23 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/function-expression/driven/boolean-cond-gt-string-value-param/boolean-cond-gt-string-value-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 23, driven: 'driven' }, { kind: 'if', arm: 'else', line: 23, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
