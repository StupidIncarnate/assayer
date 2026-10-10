import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('string-block-body-cond-param', () => {
    it('VALID: {cond: param} => if then on line 23 driven; if else on line 23 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/arrow-function/driven/string-block-body-cond-param/string-block-body-cond-param.ts'
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
