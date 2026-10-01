import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';

import { resolveTypeRefLayerBroker } from './resolve-type-ref-layer-broker';
import { resolveTypeRefLayerBrokerProxy } from './resolve-type-ref-layer-broker.proxy';

const SAME_FILE_SOURCE =
  "interface Config {\n  mode: string;\n}\n\nexport type Id = string;\n\nexport function decide(config: Config): string {\n  return config.mode;\n}\n";

const IMPORTING_SOURCE = "import type { Config } from './types';\n\nexport function decide(config: Config): string {\n  return config.mode;\n}\n";

const ALIASING_SOURCE =
  "import type { Config as Cfg } from './types';\n\nexport function decide(cfg: Cfg): string {\n  return cfg.mode;\n}\n";

const TYPES_SOURCE =
  "export interface Config {\n  mode: string;\n}\n\nexport function withDefaults(config: Config): Config {\n  return config;\n}\n";

const BARREL_SOURCE = "export * from './config';\n";

const NESTING_SOURCE =
  "import type { Db } from './db';\n\nexport interface Config {\n  db: Db;\n}\n\nexport function withDefaults(config: Config): Config {\n  return config;\n}\n";

const DB_SOURCE = "export interface Db {\n  host: string;\n}\n\nexport function open(db: Db): Db {\n  return db;\n}\n";

// A barrel that re-exports from itself: the seen-set is what stops the forward chasing its own tail.
const CYCLIC_SOURCE = "export * from './cycle';\n";

const GENERIC_SOURCE = "import type { Box } from './box';\n\nexport function open(b: Box<string>): string {\n  return b.value;\n}\n";

const BOX_SOURCE = "export type Box<T> = { value: T };\n";

const NAMESPACE_SOURCE =
  "import * as T from './leaf';\n\nexport function weigh(l: T.Leaf): number {\n  return l.weight;\n}\n";

const LEAF_SOURCE = "export interface Leaf {\n  weight: number;\n}\n\nexport function heft(l: Leaf): number {\n  return l.weight;\n}\n";

const ENUM_SOURCE = "export enum Level {\n  Low = 'low',\n  High = 'high',\n}\n";

const CLASS_SOURCE = "export class Point {\n  public x = 0;\n}\n";

const CHAIN_C_SOURCE = "import type { BeeT } from './b';\n\nexport type CeeT = BeeT;\n";

const CHAIN_B_SOURCE = "import type { AyT } from './a';\n\nexport type BeeT = AyT;\n";

const CHAIN_A_SOURCE = "export type AyT = { flag: boolean };\n";

describe('resolveTypeRefLayerBroker', () => {
  describe('a name the file declares itself', () => {
    it('VALID: {interface Config} => the declared object shape', () => {
      resolveTypeRefLayerBrokerProxy();
      const walked = walkFileTransformer({ source: SAME_FILE_SOURCE, relPath: 'src/decide.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' }),
        walked,
        relPath: 'src/decide.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });
    });

    it('VALID: {type Id = string} => the scalar the alias denotes, which its descriptor could not name', () => {
      resolveTypeRefLayerBrokerProxy();
      const walked = walkFileTransformer({ source: SAME_FILE_SOURCE, relPath: 'src/decide.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Id', typeRef: 'Id' }),
        walked,
        relPath: 'src/decide.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({ kind: 'string' });
    });
  });

  describe('a name the file imports', () => {
    it('VALID: {import type Config from ./types} => the sibling declaration', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE, specifier: './types' });
      const walked = walkFileTransformer({ source: IMPORTING_SOURCE, relPath: 'src/decide.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' }),
        walked,
        relPath: 'src/decide.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });
    });

    // The question is forwarded under the SOURCE name, never the local alias — the sibling declares
    // `Config` and has never heard of `Cfg`.
    it('VALID: {import type Config as Cfg} => the sibling is asked for Config', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE, specifier: './types' });
      const walked = walkFileTransformer({ source: ALIASING_SOURCE, relPath: 'src/decide.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Cfg', typeRef: 'Cfg' }),
        walked,
        relPath: 'src/decide.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });
    });

    it('VALID: {the import lands on a re-export barrel} => the barrel forwards to the definition', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: BARREL_SOURCE, specifier: './types' });
      proxy.setupDefinition({ fileName: '/repo/src/config.ts', source: TYPES_SOURCE, specifier: './config' });
      const walked = walkFileTransformer({ source: IMPORTING_SOURCE, relPath: 'src/decide.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' }),
        walked,
        relPath: 'src/decide.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });
    });

    // The answer arrives fully resolved: the definition's OWN imported reference is resolved in the file
    // that declares it, so one unbuildable property never hides inside a shape that reads as complete.
    it("VALID: {Config { db: Db } with Db one file further out} => the property is filled in too", () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: NESTING_SOURCE, specifier: './types' });
      proxy.setupDefinition({ fileName: '/repo/src/db.ts', source: DB_SOURCE, specifier: './db' });
      const walked = walkFileTransformer({ source: IMPORTING_SOURCE, relPath: 'src/decide.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' }),
        walked,
        relPath: 'src/decide.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Config',
        properties: [
          { name: 'db', type: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] } },
        ],
      });
    });
  });

  describe('a GENERIC declaration instantiated by the reference', () => {
    it('VALID: {Box<string> where Box<T> = { value: T }} => the shape with T filled in', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/box.ts', source: BOX_SOURCE, specifier: './box' });
      const walked = walkFileTransformer({ source: GENERIC_SOURCE, relPath: 'src/open.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Box<string>', typeRef: 'Box', typeArgs: [{ kind: 'string' }] }),
        walked,
        relPath: 'src/open.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Box',
        properties: [{ name: 'value', type: { kind: 'string' } }],
      });
    });

    // No argument means no answer for `T`, so the placeholder stays opaque and the fill seam refuses it
    // honestly rather than standing a value in for a slot nobody filled.
    it('EDGE: {Box with no type argument} => the placeholder property stays opaque', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/box.ts', source: BOX_SOURCE, specifier: './box' });
      const walked = walkFileTransformer({ source: GENERIC_SOURCE, relPath: 'src/open.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Box', typeRef: 'Box' }),
        walked,
        relPath: 'src/open.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Box',
        properties: [{ name: 'value', type: { kind: 'unknown', text: 'T', typeRef: 'T' } }],
      });
    });
  });

  describe('a NAMESPACE import', () => {
    it('VALID: {import * as T then T.Leaf} => the member off the namespace, resolved in the sibling', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/leaf.ts', source: LEAF_SOURCE, specifier: './leaf' });
      const walked = walkFileTransformer({ source: NAMESPACE_SOURCE, relPath: 'src/weigh.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'T.Leaf', typeRef: 'T.Leaf' }),
        walked,
        relPath: 'src/weigh.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Leaf',
        properties: [{ name: 'weight', type: { kind: 'number' } }],
      });
    });
  });

  describe('declarations that are not an interface or an alias', () => {
    it('VALID: {an imported enum} => the union of its members, which is what a reader of it demands', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: ENUM_SOURCE, specifier: './types' });
      const walked = walkFileTransformer({
        source: "import type { Level } from './types';\n\nexport function name(l: Level): string {\n  return String(l);\n}\n",
        relPath: 'src/name.ts',
      });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Level', typeRef: 'Level' }),
        walked,
        relPath: 'src/name.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'union',
        members: [
          { kind: 'literal', value: 'low' },
          { kind: 'literal', value: 'high' },
        ],
      });
    });

    it('VALID: {an imported class} => its instance shape, the same answer an interface gives', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: CLASS_SOURCE, specifier: './types' });
      const walked = walkFileTransformer({
        source: "import { Point } from './types';\n\nexport function readX(p: Point): number {\n  return p.x;\n}\n",
        relPath: 'src/read-x.ts',
      });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Point', typeRef: 'Point' }),
        walked,
        relPath: 'src/read-x.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'Point',
        properties: [{ name: 'x', type: { kind: 'number' } }],
      });
    });
  });

  describe('an alias CHAIN across three files', () => {
    // Each hop is an alias to the next file's name. Stopping one file short answers with a reference
    // rather than a shape, and the invoice then names a type the reader's source never spelled.
    it('VALID: {CeeT = BeeT = AyT} => the shape three files down', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/c.ts', source: CHAIN_C_SOURCE, specifier: './c' });
      proxy.setupDefinition({ fileName: '/repo/src/b.ts', source: CHAIN_B_SOURCE, specifier: './b' });
      proxy.setupDefinition({ fileName: '/repo/src/a.ts', source: CHAIN_A_SOURCE, specifier: './a' });
      const walked = walkFileTransformer({
        source: "import type { CeeT } from './c';\n\nexport function read(v: CeeT): boolean {\n  return v.flag;\n}\n",
        relPath: 'src/read.ts',
      });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'CeeT', typeRef: 'CeeT' }),
        walked,
        relPath: 'src/read.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toStrictEqual({
        kind: 'object',
        typeName: 'AyT',
        properties: [{ name: 'flag', type: { kind: 'boolean' } }],
      });
    });
  });

  describe('a name nothing in the repo declares', () => {
    it('EMPTY: {no module edge binds it} => undefined, the reference stays opaque', () => {
      resolveTypeRefLayerBrokerProxy();
      const walked = walkFileTransformer({ source: SAME_FILE_SOURCE, relPath: 'src/decide.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Missing', typeRef: 'Missing' }),
        walked,
        relPath: 'src/decide.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {the specifier lands under node_modules} => undefined', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.callerWithoutOwner({ containingFile: '/repo/src/decide.ts' });
      proxy.resolvesOutsideRepo({ fileName: '/repo/node_modules/types/index.d.ts', specifier: './types' });
      const walked = walkFileTransformer({ source: IMPORTING_SOURCE, relPath: 'src/decide.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' }),
        walked,
        relPath: 'src/decide.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {a barrel that re-exports itself} => undefined rather than unbounded recursion', () => {
      const proxy = resolveTypeRefLayerBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/cycle.ts', source: CYCLIC_SOURCE, specifier: './cycle' });
      proxy.setupDefinition({ fileName: '/repo/src/cycle.ts', source: CYCLIC_SOURCE, specifier: './cycle' });
      const walked = walkFileTransformer({ source: CYCLIC_SOURCE, relPath: 'src/cycle.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' }),
        walked,
        relPath: 'src/cycle.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('a source that failed to parse', () => {
    it('EMPTY: {a walk that did not succeed} => undefined', () => {
      resolveTypeRefLayerBrokerProxy();
      const walked = walkFileTransformer({ source: 'export function broken(: {', relPath: 'src/broken.ts' });

      const result = resolveTypeRefLayerBroker({
        reference: TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' }),
        walked,
        relPath: 'src/broken.ts',
        root: '/repo',
        seen: new Set(),
      });

      expect(result).toBe(undefined);
    });
  });
});
