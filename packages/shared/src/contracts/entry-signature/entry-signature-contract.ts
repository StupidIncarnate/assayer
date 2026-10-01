/**
 * PURPOSE: Contract for an entry signature — an analyzed entry's name, the ordered scope path that
 *   owns it, its parameters with type descriptors, its return type, and its declaration line: the
 *   callable surface a derived test case drives, plus where its params are rendered in the
 *   enrichment panel. `scopePath` is what lets two entries share a `name` without colliding — a
 *   class method (`['Classifier', 'classify']`) and a nested function (`['outer', 'inner']`) are
 *   distinguished by their path, and that same path prefixes every coverage ID they own.
 *
 *   `access` is what makes the entry ADDRESSABLE rather than merely described: the path names it,
 *   but only the access says how a caller lays hands on it (module property, `default`, or an
 *   instance method). A runner without it can only assume the named-export shape.
 *
 * USAGE:
 * entrySignatureContract.parse({
 *   name: 'classify', scopePath: ['Classifier', 'classify'],
 *   params: [{ name: 'value', type: { kind: 'number' } }], returnType: { kind: 'string' }, line: 2,
 *   access: { kind: 'method', className: 'Classifier', constructable: true },
 * });
 * // Returns a validated EntrySignature (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { entryAccessContract } from '../entry-access/entry-access-contract';
import { paramDescriptorContract } from '../param-descriptor/param-descriptor-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

export const entrySignatureContract = z.object({
  name: z.string().min(1).brand<'EntrySignatureName'>(),
  scopePath: z.array(z.string().min(1).brand<'EntrySignatureScopePath'>()),
  params: z.array(paramDescriptorContract),
  returnType: typeDescriptorContract,
  line: z.number().int().positive().brand<'EntrySignatureLine'>(),
  access: entryAccessContract,
  // The human label for a MODULE entry — the name of the single exported top-level binding its
  // tracked flow is attached to (`message`, `separator`). Present only when the module has exactly
  // one exported value binding; a side-effect-only module or one with several exports has none, and
  // the surface falls back to the file basename. Never keys identity (that stays `*module*`-rooted in
  // `scopePath`) — DISPLAY only. Absent for function/method entries, which show `name(params)`.
  exportName: z.string().min(1).brand<'EntrySignatureExportName'>().optional(),
  // The human label for an ANONYMOUS entry — the callsite that reaches it
  // (`rescale › items.map((n) => …) L2`), since `name` is its structural projection and a surface
  // that printed that would be printing a cache key. Present only for a scope with no name to
  // borrow; a named entry has none and shows `name(params)`. DISPLAY only, like `exportName`.
  label: z.string().min(1).brand<'EntrySignatureLabel'>().optional(),
}).brand<'EntrySignature'>();

export type EntrySignature = z.infer<typeof entrySignatureContract>;
