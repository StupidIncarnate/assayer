import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'no-default.ts'), 'utf8');
const relPath = 'src/happy-path/switch/no-default/no-default.ts';

const CASE_GET = '*module*/routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get';
const CASE_POST = '*module*/routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post';
const TOP_EXIT = '*module*/routeLabel/exit@top';

describe('switch / no-default — a tail switch with no default, whose clauses fall through', () => {
  // The switch twin of `if / no-else`: a tail switch with no default used to mint its OWN completion
  // exit per CASE clause on top of the enclosing scope's own unaccounted-for exit — every clause's
  // own probe firing right alongside the enclosing one, since falling out of any clause and falling
  // out unmatched both continue into the exact same code. `routeLabel` has exactly ONE exit: the
  // enclosing scope's own `exit@top`. No `#then`-guarded completion exists for either case.
  it('VALID: {tail switch with no default} => one entry, two case branches, exactly ONE exit', () => {
    const result = analyzeExtractBroker({ source, relPath });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'routeLabel',
            scopePath: ['*module*', 'routeLabel'],
            params: [
              {
                name: 'method',
                type: {
                  kind: 'union',
                  members: [
                    { kind: 'literal', value: 'get' },
                    { kind: 'literal', value: 'post' },
                  ],
                },
              },
            ],
            returnType: { kind: 'unknown', text: 'void' },
            line: 5,
            access: { kind: 'named' },
          },
          branches: [
            {
              coverageId: CASE_GET,
              kind: 'switch',
              condition: {
                kind: 'leaf',
                id: `${CASE_GET}#leaf`,
                operandParamName: 'method',
                operandType: {
                  kind: 'union',
                  members: [
                    { kind: 'literal', value: 'get' },
                    { kind: 'literal', value: 'post' },
                  ],
                },
                predicate: { kind: 'eq', literal: 'get' },
              },
              startLine: 7,
              endLine: 9,
            },
            {
              coverageId: CASE_POST,
              kind: 'switch',
              condition: {
                kind: 'leaf',
                id: `${CASE_POST}#leaf`,
                operandParamName: 'method',
                operandType: {
                  kind: 'union',
                  members: [
                    { kind: 'literal', value: 'get' },
                    { kind: 'literal', value: 'post' },
                  ],
                },
                predicate: { kind: 'eq', literal: 'post' },
              },
              startLine: 10,
              endLine: 12,
            },
          ],
          exits: [{ coverageId: TOP_EXIT, kind: 'implicit', guardPath: [], line: 14 }],
        },
      ],
    });
  });

  // Every bucket — `get`, `post`, and the (unrepresentable, since the union is exactly those two)
  // unmatched path — converges on the SAME `exit@top` (§5.13). The first is salient; the second is
  // the grayed breadth twin. If a per-clause completion were minted instead, the `get` case would
  // predict a different exit than the one actually observed and fail a real run — pinned end to end
  // by `run-unit-broker.integration.test.ts`'s `SWITCH_NO_DEFAULT_SPECIMEN`.
  it('VALID: {tail switch with no default} => both cases converge on the one exit, second grayed', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesPath: [TOP_EXIT], arrange: [{ kind: 'param', param: 'method', value: 'get' }], salient: true },
      { reachesPath: [TOP_EXIT], arrange: [{ kind: 'param', param: 'method', value: 'post' }], salient: false },
    ]);
  });

  it('VALID: {tail switch with no default} => nothing admitted as undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots }).toStrictEqual({ undriven: [], darkSpots: [] });
  });
});
