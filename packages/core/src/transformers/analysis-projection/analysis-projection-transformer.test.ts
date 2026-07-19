import { BranchNodeStub, GlobalUseStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { ValueUseStub } from '../../contracts/value-use/value-use.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { analysisProjectionTransformer } from './analysis-projection-transformer';

const MODULE_BRANCH = BranchNodeStub({ coverageId: '*module*/if:id:flag' });

describe('analysisProjectionTransformer', () => {
  describe('only EXPORTED functions become entries', () => {
    it('VALID: {an exported function} => one entry carrying its signature, branches, and exits', () => {
      const walked = WalkFileResultStub({
        scopes: [ScopeRecordStub({ scopePath: ['classify'], name: 'classify', kind: 'function', exported: true })],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'classify',
              scopePath: ['classify'],
              params: [{ name: 'value', type: { kind: 'number' } }],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'named' },
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });

    it('VALID: {a nested private helper} => no entry, since driving it directly would be testing a private', () => {
      const walked = WalkFileResultStub({
        scopes: [ScopeRecordStub({ scopePath: ['helper'], name: 'helper', kind: 'function', exported: false })],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({ success: true, functions: [] });
    });

    it('VALID: {an exported function beside a private one} => only the exported one', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({ scopePath: ['classify'], name: 'classify', kind: 'function', exported: true }),
          ScopeRecordStub({ scopePath: ['helper'], name: 'helper', kind: 'function', exported: false }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'classify',
              scopePath: ['classify'],
              params: [{ name: 'value', type: { kind: 'number' } }],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'named' },
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });
  });

  describe('the module scope appears when it holds branch logic', () => {
    it('VALID: {module scope with a branch} => an entry, because that top-level logic is testable', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'unreachable' },
            params: [],
            branches: [MODULE_BRANCH],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'unreachable' },
            },
            branches: [MODULE_BRANCH],
            exits: [],
          },
        ],
      });
    });

    it('VALID: {module scope with no branches} => no entry, since almost no file has testable top-level flow', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            branches: [],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({ success: true, functions: [] });
    });

    it('VALID: {an unexported module scope with a branch} => still an entry, since the module rule ignores export', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'unreachable' },
            params: [],
            branches: [MODULE_BRANCH],
          }),
          ScopeRecordStub({ scopePath: ['helper'], name: 'helper', kind: 'function', exported: false }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'unreachable' },
            },
            branches: [MODULE_BRANCH],
            exits: [],
          },
        ],
      });
    });
  });

  describe('the module scope appears when it CONSUMES an external', () => {
    // Calling an import is a consumption site — it exercises code the file did not author — so its
    // module scope is worth a case even with no branching of its own.
    it('VALID: {module scope calling an import} => an entry, because calling an import is a consumption site', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            branches: [],
            calls: [CallSiteStub({ callee: { target: 'import', specifier: './greeting', importedName: 'greeting' }, args: [] })],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'module' },
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });

    // A called ambient global (`console.log(...)`) is a consumption site too, recorded on the
    // file-level globalUses channel — which is the module scope's, since top-level code runs on import.
    it('VALID: {module scope with a called ambient global} => an entry', () => {
      const walked = WalkFileResultStub({
        globalUses: [GlobalUseStub()],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            branches: [],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'module' },
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });

    // Binding an import as a VALUE (`const separator = sep`) is a data flow into external code, so its
    // module scope is a consumption entry even with no call and no branching of its own.
    it('VALID: {module scope binding an import as a value} => an entry, because a value flow into an import is consumption', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            branches: [],
            valueUses: [ValueUseStub({ target: 'import', specifier: 'node:path', importedName: 'sep' })],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'module' },
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });

    // A member ACCESS that is not called (`process.env`) is a value read, not a consumption call — so
    // it alone does not make the module an entry.
    it('VALID: {module scope with only an uncalled global access} => no entry, since reading a value is not a call', () => {
      const walked = WalkFileResultStub({
        globalUses: [GlobalUseStub({ name: 'process', member: 'env', called: false, args: [] })],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            branches: [],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({ success: true, functions: [] });
    });

    // Calling its OWN local function is not consumption: that local function is already the entry, so
    // projecting the module too would test the same code twice.
    it('VALID: {module scope calling only a local function} => no entry, since the local function is already the entry', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            branches: [],
            calls: [CallSiteStub({ callee: { target: 'local', name: 'inner', startLine: 2 } })],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({ success: true, functions: [] });
    });
  });

  describe('a module entry is labelled by its single exported binding', () => {
    // `export const separator = sep` — one exported binding, so the entry carries `exportName` for the
    // surface to show instead of the internal `*module*`. Content only, never a path.
    it('VALID: {module scope with exactly one exported binding} => the entry carries that exportName', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            branches: [],
            valueUses: [ValueUseStub({ target: 'import', specifier: 'node:path', importedName: 'sep' })],
            exportedBindings: ['separator'],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'module' },
              exportName: 'separator',
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });

    // Two exports name no single binding, so the entry carries no `exportName` and the surface falls
    // back to the file basename.
    it('VALID: {module scope with two exported bindings} => the entry carries no exportName', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            branches: [],
            valueUses: [ValueUseStub({ target: 'import', specifier: 'node:path', importedName: 'sep' })],
            exportedBindings: ['mode', 'dir'],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'module' },
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });
  });

  describe('a walk with nothing in it', () => {
    it('EMPTY: {no scopes} => no entries', () => {
      expect(analysisProjectionTransformer({ walked: WalkFileResultStub({ scopes: [] }) })).toStrictEqual({
        success: true,
        functions: [],
      });
    });
  });

  describe('a walk that failed', () => {
    it('ERROR: {parse error} => the positioned error passes straight through', () => {
      const walked = WalkFileResultStub({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });
    });
  });
});
