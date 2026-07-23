import {
  stubGraphHarness,
  BRANCH_LOCAL_REL,
  CROSS_FILE_SHAPE_TYPES_REL,
  CROSS_FILE_SHAPE_READERS,
  MULTI_READ_REL,
} from '../../../../test/harnesses/stub-graph.harness';

describe('compileStubGraphBroker (integration)', () => {
  describe('the committed branch-local specimen stitched into its stub index', () => {
    const stitch = stubGraphHarness();

    it("VALID: {decide(config) branches on config.mode === 'a'} => one Config object stub, mode demanded ['a','abc123'], this file the reader", async () => {
      const result = await stitch.stubBranchLocal();

      expect({ objectStubs: result.index.objectStubs, envStubs: result.index.envStubs }).toStrictEqual({
        objectStubs: [
          {
            key: `${BRANCH_LOCAL_REL}#Config`,
            definitionRelPath: BRANCH_LOCAL_REL,
            typeName: 'Config',
            properties: [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }],
            readers: [BRANCH_LOCAL_REL],
          },
        ],
        envStubs: [],
      });
    });

    it('VALID: {the same specimen stitched twice} => byte-identical stub index (determinism)', async () => {
      const first = await stitch.stubBranchLocal();
      const second = await stitch.stubBranchLocal();

      expect(JSON.stringify(second.index)).toBe(JSON.stringify(first.index));
    });
  });

  describe('the cross-file-shape specimen: one Config, two importing readers, unioned into one stub', () => {
    const stitch = stubGraphHarness();

    // The cross-system payoff: `Config` is DECLARED in `types.ts` and branched on by two importers that
    // each `import { Config } from './types'`. The stitch inverts the resolved index — the type-only
    // import edge resolves `Config` to its definition — and UNIONS each reader's per-property demand onto
    // the one definition-keyed stub: `mode` from `cross-file-shape.ts`, `region` from `reader-b.ts`, and
    // `retries` — which no reader touches — an honest `unknown`. The definition file is NOT itself a
    // reader (it declares the type, it does not branch on it), so `readers` is exactly the two importers.
    // Asserted independent of the sad-path RUN verdict: the readers admit their branches undriven, but
    // the branched values are real demands the stitch collects regardless.
    it('VALID: {Config declared in types.ts, mode read in one file and region in another} => one stub keyed on types.ts, mode+region demanded, retries unknown, both readers listed', async () => {
      const result = await stitch.stubCrossFileShape();

      expect({ objectStubs: result.index.objectStubs, envStubs: result.index.envStubs }).toStrictEqual({
        objectStubs: [
          {
            key: `${CROSS_FILE_SHAPE_TYPES_REL}#Config`,
            definitionRelPath: CROSS_FILE_SHAPE_TYPES_REL,
            typeName: 'Config',
            properties: [
              { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
              { name: 'region', demand: { kind: 'demanded', values: ['abc123', 'us'] } },
              { name: 'retries', demand: { kind: 'unknown' } },
            ],
            readers: CROSS_FILE_SHAPE_READERS,
          },
        ],
        envStubs: [],
      });
    });

    it('VALID: {the cross-file specimen stitched twice} => byte-identical stub index (determinism)', async () => {
      const first = await stitch.stubCrossFileShape();
      const second = await stitch.stubCrossFileShape();

      expect(JSON.stringify(second.index)).toBe(JSON.stringify(first.index));
    });
  });

  describe('the env-object multi-read specimen stitched into its stub index', () => {
    const stitch = stubGraphHarness();

    // `process.env` is an object and each property it reads is a stub. `multi-read` reads two: `CODE`
    // via `Number(process.env.CODE)` compared in a switch (cases 1 and 2), and `MODE` via a bare
    // `process.env.MODE === 'production'`. The stitch folds each into one env stub keyed
    // `process.env#<PROP>`, its `values` the compared literals GUESSED plus a representative for
    // anything else (numeric `7` for CODE, the string representative for MODE), `guessed: true`, and
    // this file its reader. Asserted independent of the sad-path RUN verdict: the MODE branch is
    // admitted undriven, but its literal is a real stub demand regardless.
    it("VALID: {CODE in a switch, MODE in a bare compare} => two env stubs, CODE guessed [1,2,7], MODE ['abc123','production'], this file the reader", async () => {
      const result = await stitch.stubMultiRead();

      expect({ objectStubs: result.index.objectStubs, envStubs: result.index.envStubs }).toStrictEqual({
        objectStubs: [],
        envStubs: [
          {
            key: 'process.env#CODE',
            property: 'CODE',
            values: [1, 2, 7],
            guessed: true,
            readers: [MULTI_READ_REL],
          },
          {
            key: 'process.env#MODE',
            property: 'MODE',
            values: ['abc123', 'production'],
            guessed: true,
            readers: [MULTI_READ_REL],
          },
        ],
      });
    });

    it('VALID: {the env specimen stitched twice} => byte-identical stub index (determinism)', async () => {
      const first = await stitch.stubMultiRead();
      const second = await stitch.stubMultiRead();

      expect(JSON.stringify(second.index)).toBe(JSON.stringify(first.index));
    });
  });
});
