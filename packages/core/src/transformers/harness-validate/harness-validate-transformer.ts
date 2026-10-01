/**
 * PURPOSE: Reconciles one harness's declared keys against the ANALYSIS of the source file it addresses,
 *   and reports every way the declaration is wrong as a P1 build error. It is the harness twin of the
 *   stub-overlay reconcile: a committed artifact that names something the derived model does not have is
 *   stale, and staleness that only shows up at run time is a silent lie about what is covered.
 *
 *   Three ways a key is wrong, and they send the reader to three different places:
 *
 *   - The ENTRY is not in the file. A rename moved the surface out from under a harness that still names
 *     the old one, so the error suggests the closest surviving entry and lists them all.
 *   - The PARAMETER is not on that entry. Same rename, one level down, answered the same way.
 *   - The parameter EXISTS and Assayer can build it. Nothing invoiced it, so a value here would silently
 *     displace a derived one and the reader would never learn which value their test actually ran with.
 *     A harness is gap-fill; a key with no gap behind it is the ceremonial declaration this project
 *     refuses.
 *
 *   And one way the FILE is wrong: it declares nothing at all. A harness with no invoiced gaps does not
 *   exist as a file — it reads as coverage that was arranged when nothing was.
 *
 *   MODULE scopes are not candidates. A module entry takes no parameters, so no harness key can validly
 *   name one, and listing `*module*` among the file's entries would send a reader looking for a name
 *   they cannot use.
 *
 *   A DECLARING SCOPE — a same-file private a named-call funnel folded into its host, no entry of its
 *   own — is a candidate exactly like a top-level entry, read off `FileAnalysis.declaringScopes`: the
 *   ONE source the input-gap invoice's `owner` and this validator both consult, so a key naming the
 *   scope the invoice names (`on \`build\``) reconciles against the same fact that built the sentence,
 *   never a second idea of what a driving route folded in. A funnelled CALLBACK is never a candidate —
 *   see `FileAnalysis.declaringScopes`'s own doc for why realize can never bind one.
 *
 *   A FOURTH way a key is wrong, checked only once the first three have cleared it: the parameter EXISTS,
 *   IS a genuine gap, and the value supplied for it is not a value of the declared type. `report:
 *   undefined` and a callback of the wrong signature both validate today by the first three rules alone
 *   — a key is a key whatever it is bound to — so this is where the VALUE half of the declaration is
 *   finally read, off the harness's own AST via `suppliedTypes` (`compile-harness-graph-broker` reads it
 *   with `harness-value-types-transformer`, the same conjunction of file and key this
 *   transformer already walks). `undefined` needs no special rule: it reads as the opaque `unknown`
 *   kind (`is-type-compatible`'s own doc), which fails unless the declared type itself admits it — the
 *   same clause that already lets an opaque DECLARED type through untouched. This is Assayer
 *   contradicting a type it read itself, never one of the four admissions.
 *
 *   Errors ride the SAME `{ relPath, line, column, message }` channel as a broken import — exit 1, the
 *   same class — and each is filed against the HARNESS file, because that is the file to edit.
 *
 * USAGE:
 * harnessValidateTransformer({ relPath, targetRelPath, keys, entries, declaringScopes, suppliedTypes });
 * // Returns [] when every key still names a refused parameter of a compatible type, or one record per wrong key
 */
import { harnessValidateContract } from '../../contracts/harness-validate/harness-validate-contract';
import type { HarnessValidate } from '../../contracts/harness-validate/harness-validate-contract';
import type { DeclaringScope, EntrySignature, HarnessInputKey, ParamDescriptor, TypeDescriptor } from '@assayer/shared/contracts';

import { isTypeCompatibleGuard } from '../../guards/is-type-compatible/is-type-compatible-guard';
import { isTypeFillableGuard } from '../../guards/is-type-fillable/is-type-fillable-guard';
import { didYouMeanTransformer } from '../did-you-mean/did-you-mean-transformer';
import { typeTextTransformer } from '../type-text/type-text-transformer';

const HARNESS_LINE = 1;
const HARNESS_COLUMN = 1;

export const harnessValidateTransformer = ({
  relPath,
  targetRelPath,
  keys,
  entries,
  declaringScopes,
  suppliedTypes,
}: {
  relPath: string;
  targetRelPath: string;
  keys: readonly HarnessInputKey[];
  entries: readonly EntrySignature[];
  declaringScopes: readonly DeclaringScope[];
  suppliedTypes: readonly { entry: string; param: string; type: TypeDescriptor }[];
}): HarnessValidate => {
  const callable: readonly { name: string; params: readonly ParamDescriptor[] }[] = [
    ...entries.filter((entry) => entry.access.kind !== 'module'),
    ...declaringScopes,
  ];
  const entryByName = new Map(callable.map((entry) => [String(entry.name), entry]));
  const entryNames = callable.map((entry) => entry.name);

  const emptyFile =
    keys.length === 0
      ? [
          `\`${String(relPath)}\` declares no inputs, so it closes nothing. A harness exists only to supply ` +
            `values Assayer refused to construct: take the input gap reported against \`${String(targetRelPath)}\` ` +
            'and declare the parameter it names — `assayerHarness({ inputs: { <entry>: { <parameter>: <value> } } })`. ' +
            `If \`${String(targetRelPath)}\` has no input gap, this file has nothing to close and belongs deleted.`,
        ]
      : [];

  const keyErrors = keys.flatMap((key) => {
    const entry = entryByName.get(String(key.entry));

    if (entry === undefined) {
      const suggestion = didYouMeanTransformer({ name: key.entry, candidates: entryNames });
      const known = entryNames.length === 0 ? 'it has no callable entries' : `its entries are ${entryNames.map((name) => `\`${String(name)}\``).join(', ')}`;

      return [
        `\`${String(relPath)}\` declares inputs for \`${String(key.entry)}\`, which \`${String(targetRelPath)}\` ` +
          `does not offer — ${known}${suggestion === undefined ? '' : `; did you mean \`${String(suggestion)}\``}. ` +
          '`inputs` is keyed by ENTRY name, then PARAMETER name, so rename the key to the entry that owes the ' +
          'input or delete it.',
      ];
    }

    const param = entry.params.find((candidate) => String(candidate.name) === String(key.param));

    if (param === undefined) {
      const paramNames = entry.params.map((candidate) => candidate.name);
      const suggestion = didYouMeanTransformer({ name: key.param, candidates: paramNames });
      const known = paramNames.length === 0 ? 'it takes no parameters' : `its parameters are ${paramNames.map((name) => `\`${String(name)}\``).join(', ')}`;

      return [
        `\`${String(relPath)}\` declares an input \`${String(key.param)}\` on \`${String(key.entry)}\`, which is ` +
          `not a parameter of \`${String(key.entry)}\` in \`${String(targetRelPath)}\` — ${known}` +
          `${suggestion === undefined ? '' : `; did you mean \`${String(suggestion)}\``}. Rename the key to the ` +
          'parameter the input gap names, or delete it.',
      ];
    }

    if (!isTypeFillableGuard({ type: param.type })) {
      const supplied = suppliedTypes.find(
        (candidate) => String(candidate.entry) === String(key.entry) && String(candidate.param) === String(key.param),
      );

      if (supplied === undefined || isTypeCompatibleGuard({ declared: param.type, supplied: supplied.type })) {
        return [];
      }

      const declaredText = param.declaredText ?? typeTextTransformer({ type: param.type });
      const suppliedText = typeTextTransformer({ type: supplied.type });

      return [
        `\`${String(relPath)}\` declares an input \`${String(key.param)}\` on \`${String(key.entry)}\`, but supplies a ` +
          `value of the wrong type. \`${String(targetRelPath)}\` declares \`${String(key.entry)}\`'s \`${String(key.param)}\` ` +
          `as \`${String(declaredText)}\`, and the value supplied here is \`${String(suppliedText)}\`. Supply a value of ` +
          `type \`${String(declaredText)}\` instead, or change \`${String(key.param)}\`'s declared type in ` +
          `\`${String(targetRelPath)}\` if it is meant to accept \`${String(suppliedText)}\`.`,
      ];
    }

    return [
      `\`${String(relPath)}\` declares an input \`${String(key.param)}\` on \`${String(key.entry)}\`, a parameter ` +
        `Assayer builds itself from its declared type — no input gap was raised for it. A harness is GAP-FILL: a ` +
        'value here would silently displace the derived one, so a reader could no longer tell which value their ' +
        `case ran with. Delete this key; only a parameter \`${String(targetRelPath)}\` is invoiced for belongs here.`,
    ];
  });

  return harnessValidateContract.parse([...emptyFile, ...keyErrors].map((message) => ({
    relPath,
    line: HARNESS_LINE,
    column: HARNESS_COLUMN,
    message,
  })));
};
