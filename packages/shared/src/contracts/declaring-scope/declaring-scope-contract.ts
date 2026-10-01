/**
 * PURPOSE: Contract for a declaring scope — a same-file PRIVATE a NAMED-CALL funnel folds into a host
 *   entry rather than projecting as an entry of its own (a branchless surface returning it, or a
 *   resolvable call `through-caller-cases` drives). It carries the ONE fact `harness-validate` and the
 *   harness-realize overlay both need and would otherwise read two different ways: the scope's OWN
 *   addressable name and its OWN full parameter list, so a harness key naming the scope an input-gap
 *   invoice names (`on \`build\``) reconciles against the SAME source that built the invoice, rather than
 *   a validator's separate idea of what a driving route folded in.
 *
 *   `hostEntry` names the entry a reader actually calls to reach it — the funnel host, or the
 *   through-caller's caller — because BINDING a supplied value happens at the call site the scope is
 *   reached through, never spliced into an unrelated argument list.
 *
 *   Deliberately never carries a funnelled CALLBACK: its refused element sits inside the ARRAY its host
 *   receives, and `ArrangeValue` has no representation for a harness-bound value living inside a
 *   composite, so admitting one here would let `harness-validate` accept a key `harness-realize` can
 *   never bind (`plan/open-defects.md` C1). A callback is also anonymous, so it has no `name` to key by
 *   that is not itself a display projection — a second reason it stays out until that capability lands.
 *
 * USAGE:
 * declaringScopeContract.parse({
 *   name: 'build', hostEntry: 'audit',
 *   params: [{ name: 'report', type: { kind: 'callable', text: '(m: string) => string' } }],
 * });
 * // Returns a validated DeclaringScope (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { entrySignatureContract } from '../entry-signature/entry-signature-contract';
import { paramDescriptorContract } from '../param-descriptor/param-descriptor-contract';

export const declaringScopeContract = z.object({
  name: z.string().min(1).brand<'DeclaringScopeName'>(),
  hostEntry: entrySignatureContract.shape.name,
  params: z.array(paramDescriptorContract),
}).brand<'DeclaringScope'>();

export type DeclaringScope = z.infer<typeof declaringScopeContract>;
