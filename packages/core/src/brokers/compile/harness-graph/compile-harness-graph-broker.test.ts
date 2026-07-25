import {
  CompiledFileBlobStub,
  ContentHashStub,
  FileAnalysisStub,
  RelPathStub,
  ResolvedIndexStub,
} from '@assayer/shared/contracts';

import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { compileHarnessGraphBroker } from './compile-harness-graph-broker';
import { compileHarnessGraphBrokerProxy } from './compile-harness-graph-broker.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const AUDIT_BLOB = CompiledFileBlobStub({
  relPath: 'src/audit.ts',
  analysis: FileAnalysisStub({
    functions: [
      {
        entry: {
          name: 'audit',
          scopePath: ['*module*', 'audit'],
          params: [
            { name: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
            { name: 'size', type: { kind: 'number' } },
          ],
          returnType: { kind: 'string' },
          line: 3,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [],
        cases: [],
      },
    ],
    declaredTypes: [],
  }),
});

const HARNESS_SOURCE = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({',
  '  inputs: {',
  '    audit: { report: (message: string): string => message },',
  '  },',
  '});',
].join('\n');

const EDITED_SOURCE = `${HARNESS_SOURCE}\n`;

const WRONG_ENTRY_SOURCE = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audot: { report: (m: string): string => m } } });',
].join('\n');

const WRONG_PARAM_SOURCE = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { repot: (m: string): string => m } } });',
].join('\n');

const FILLABLE_PARAM_SOURCE = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { size: 7 } } });',
].join('\n');

const NOTHING_INVOICED_SOURCE = ["import { assayerHarness } from '@assayer/core';", '', 'assayerHarness({ inputs: {} });'].join(
  '\n',
);

const THROWING_SOURCE = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'const boom = (): string => { throw new Error("no such value"); };',
  'assayerHarness({ inputs: { audit: { report: boom() } } });',
].join('\n');

const HARNESS_HASH_FOR_SOURCE = '154d4ddeacb957191a21f3a4dd45e97c0380ecfea8cccde178e8c3d52926181a';
const HARNESS_HASH_FOR_EDIT = '6ba213833769c774182c3e2bfe834a25d6974a2b3e7c64f1e2f6cb0829499617';

const BAND_BLOB = CompiledFileBlobStub({
  relPath: 'src/band.ts',
  analysis: FileAnalysisStub({
    functions: [
      {
        entry: {
          name: 'band',
          scopePath: ['*module*', 'band'],
          params: [{ name: 'cb', type: { kind: 'callable', text: '(x: number) => number' } }],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [],
        cases: [],
      },
    ],
    declaredTypes: [],
  }),
});

const BAND_HARNESS_SOURCE = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { band: { cb: (x: number): number => x } } });',
].join('\n');

describe('compileHarnessGraphBroker', () => {
  describe('a harness that closes an invoiced gap', () => {
    it('VALID: {src/audit.harness.ts declaring audit.report} => records the (entry, param) key against its target', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/audit.harness.ts' }),
            content: FileContentsStub({ value: HARNESS_SOURCE }),
          },
        ],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: EMPTY_HASH,
          tsconfigHash: EMPTY_HASH,
          harnessHash: HARNESS_HASH_FOR_SOURCE,
          harnesses: [
            {
              relPath: 'src/audit.harness.ts',
              targetRelPath: 'src/audit.ts',
              keys: [{ entry: 'audit', param: 'report' }],
            },
          ],
        },
        errors: [],
      });
    });

    it('VALID: {a config-dir + namespace} => writes the index to the tmp path under .assayer/cache/harness', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/audit.harness.ts' }),
            content: FileContentsStub({ value: HARNESS_SOURCE }),
          },
        ],
      });

      expect(proxy.getWrittenPath()).toBe('/repo/.assayer/cache/harness/feature-x.json.tmp');
    });

    it('VALID: {the same layout, an edited harness} => the harness hash moves while layout and tsconfig hashes stay', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/audit.harness.ts' }),
            content: FileContentsStub({ value: EDITED_SOURCE }),
          },
        ],
      });

      expect(result.index).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        harnessHash: HARNESS_HASH_FOR_EDIT,
        harnesses: [
          {
            relPath: 'src/audit.harness.ts',
            targetRelPath: 'src/audit.ts',
            keys: [{ entry: 'audit', param: 'report' }],
          },
        ],
      });
    });

    it('VALID: {two harness files supplied out of alphabetical order} => the written index sorts by relPath and the harness hash is order-independent', async () => {
      const reversedProxy = compileHarnessGraphBrokerProxy();
      reversedProxy.queueBlob({ blob: AUDIT_BLOB });
      reversedProxy.queueBlob({ blob: BAND_BLOB });
      const reversedResult = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [
          { relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() },
          { relPath: RelPathStub({ value: 'src/band.ts' }), contentHash: ContentHashStub({ value: 'a'.repeat(64) }) },
        ],
        harnesses: [
          { relPath: RelPathStub({ value: 'src/band.harness.ts' }), content: FileContentsStub({ value: BAND_HARNESS_SOURCE }) },
          { relPath: RelPathStub({ value: 'src/audit.harness.ts' }), content: FileContentsStub({ value: HARNESS_SOURCE }) },
        ],
      });

      const forwardProxy = compileHarnessGraphBrokerProxy();
      forwardProxy.queueBlob({ blob: AUDIT_BLOB });
      forwardProxy.queueBlob({ blob: BAND_BLOB });
      const forwardResult = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [
          { relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() },
          { relPath: RelPathStub({ value: 'src/band.ts' }), contentHash: ContentHashStub({ value: 'a'.repeat(64) }) },
        ],
        harnesses: [
          { relPath: RelPathStub({ value: 'src/audit.harness.ts' }), content: FileContentsStub({ value: HARNESS_SOURCE }) },
          { relPath: RelPathStub({ value: 'src/band.harness.ts' }), content: FileContentsStub({ value: BAND_HARNESS_SOURCE }) },
        ],
      });

      expect(reversedResult).toStrictEqual(forwardResult);
      expect(reversedResult).toStrictEqual({
        index: {
          layoutHash: EMPTY_HASH,
          tsconfigHash: EMPTY_HASH,
          harnessHash: forwardResult.index.harnessHash,
          harnesses: [
            { relPath: 'src/audit.harness.ts', targetRelPath: 'src/audit.ts', keys: [{ entry: 'audit', param: 'report' }] },
            { relPath: 'src/band.harness.ts', targetRelPath: 'src/band.ts', keys: [{ entry: 'band', param: 'cb' }] },
          ],
        },
        errors: [],
      });
    });

    it('EMPTY: {no harness files} => an empty inventory keyed on the empty digest', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: EMPTY_HASH,
          tsconfigHash: EMPTY_HASH,
          harnessHash: EMPTY_HASH,
          harnesses: [],
        },
        errors: [],
      });
    });
  });

  describe('a harness the stitch cannot read', () => {
    it('ERROR: {a harness with no source file at its basename} => a P1 naming the file, and no index entry', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/missing.harness.ts' }),
            content: FileContentsStub({ value: HARNESS_SOURCE }),
          },
        ],
      });

      expect({ harnesses: result.index.harnesses, errors: result.errors }).toStrictEqual({
        harnesses: [],
        errors: [
          {
            relPath: 'src/missing.harness.ts',
            line: 1,
            column: 1,
            message:
              '`src/missing.harness.ts` supplies inputs for a file that is not in the analysed surface. A harness ' +
              'is COLOCATED with its source and carries the same basename — `src/audit.ts` is addressed by ' +
              '`src/audit.harness.ts`, always `.ts` even beside a `.tsx`. Move this file beside the source it ' +
              'declares inputs for, or delete it.',
          },
        ],
      });
    });

    it('ERROR: {a harness whose module body throws} => a P1 naming the file and the thrown message', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/audit.harness.ts' }),
            content: FileContentsStub({ value: THROWING_SOURCE }),
          },
        ],
      });

      expect({ harnesses: result.index.harnesses, errors: result.errors }).toStrictEqual({
        harnesses: [],
        errors: [
          {
            relPath: 'src/audit.harness.ts',
            line: 1,
            column: 1,
            message:
              '`src/audit.harness.ts` threw while Assayer read it: no such value. Loading IS the read — the ' +
              '`assayerHarness` call is what registers a harness — so a module body that cannot run declares ' +
              'nothing at all. Keep the file to the `assayerHarness` call and the values it hands over.',
          },
        ],
      });
    });
  });

  describe('a harness whose keys are wrong', () => {
    it('ERROR: {a key naming an entry the file does not offer} => a P1 with did-you-mean', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/audit.harness.ts' }),
            content: FileContentsStub({ value: WRONG_ENTRY_SOURCE }),
          },
        ],
      });

      expect(result.errors).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares inputs for `audot`, which `src/audit.ts` does not offer — its ' +
            'entries are `audit`; did you mean `audit`. `inputs` is keyed by ENTRY name, then PARAMETER name, so ' +
            'rename the key to the entry that owes the input or delete it.',
        },
      ]);
    });

    it('ERROR: {a key naming a parameter the entry does not take} => a P1 with did-you-mean', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/audit.harness.ts' }),
            content: FileContentsStub({ value: WRONG_PARAM_SOURCE }),
          },
        ],
      });

      expect(result.errors).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares an input `repot` on `audit`, which is not a parameter of `audit` in ' +
            '`src/audit.ts` — its parameters are `report`, `size`; did you mean `report`. Rename the key to the ' +
            'parameter the input gap names, or delete it.',
        },
      ]);
    });

    it('ERROR: {a key naming a parameter Assayer can build} => a P1 saying the harness does not own it', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/audit.harness.ts' }),
            content: FileContentsStub({ value: FILLABLE_PARAM_SOURCE }),
          },
        ],
      });

      expect(result.errors).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares an input `size` on `audit`, a parameter Assayer builds itself from ' +
            'its declared type — no input gap was raised for it. A harness is GAP-FILL: a value here would ' +
            'silently displace the derived one, so a reader could no longer tell which value their case ran ' +
            'with. Delete this key; only a parameter `src/audit.ts` is invoiced for belongs here.',
        },
      ]);
    });

    it('ERROR: {a harness with nothing invoiced in it} => a P1 saying it closes nothing', async () => {
      const proxy = compileHarnessGraphBrokerProxy();
      proxy.queueBlob({ blob: AUDIT_BLOB });

      const result = await compileHarnessGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/audit.ts' }), contentHash: ContentHashStub() }],
        harnesses: [
          {
            relPath: RelPathStub({ value: 'src/audit.harness.ts' }),
            content: FileContentsStub({ value: NOTHING_INVOICED_SOURCE }),
          },
        ],
      });

      expect(result.errors).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares no inputs, so it closes nothing. A harness exists only to supply ' +
            'values Assayer refused to construct: take the input gap reported against `src/audit.ts` and declare ' +
            'the parameter it names — `assayerHarness({ inputs: { <entry>: { <parameter>: <value> } } })`. If ' +
            '`src/audit.ts` has no input gap, this file has nothing to close and belongs deleted.',
        },
      ]);
    });
  });
});
