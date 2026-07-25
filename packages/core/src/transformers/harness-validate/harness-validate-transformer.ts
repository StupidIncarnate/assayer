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
 *   Errors ride the SAME `{ relPath, line, column, message }` channel as a broken import — exit 1, the
 *   same class — and each is filed against the HARNESS file, because that is the file to edit.
 *
 * USAGE:
 * harnessValidateTransformer({ relPath, targetRelPath, keys, entries });
 * // Returns [] when every key still names a refused parameter, or one record per wrong key
 */
import { columnNumberContract, lineNumberContract } from '@assayer/shared/contracts';
import type { ColumnNumber, EntrySignature, HarnessInputKey, LineNumber, RelPath } from '@assayer/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { isTypeFillableGuard } from '../../guards/is-type-fillable/is-type-fillable-guard';
import { didYouMeanTransformer } from '../did-you-mean/did-you-mean-transformer';

const HARNESS_LINE = 1;
const HARNESS_COLUMN = 1;

export const harnessValidateTransformer = ({
  relPath,
  targetRelPath,
  keys,
  entries,
}: {
  relPath: RelPath;
  targetRelPath: RelPath;
  keys: readonly HarnessInputKey[];
  entries: readonly EntrySignature[];
}): readonly { relPath: RelPath; line: LineNumber; column: ColumnNumber; message: ErrorMessage }[] => {
  const callable = entries.filter((entry) => entry.access.kind !== 'module');
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
      return [];
    }

    return [
      `\`${String(relPath)}\` declares an input \`${String(key.param)}\` on \`${String(key.entry)}\`, a parameter ` +
        `Assayer builds itself from its declared type — no input gap was raised for it. A harness is GAP-FILL: a ` +
        'value here would silently displace the derived one, so a reader could no longer tell which value their ' +
        `case ran with. Delete this key; only a parameter \`${String(targetRelPath)}\` is invoiced for belongs here.`,
    ];
  });

  return [...emptyFile, ...keyErrors].map((message) => ({
    relPath,
    line: lineNumberContract.parse(HARNESS_LINE),
    column: columnNumberContract.parse(HARNESS_COLUMN),
    message: errorMessageContract.parse(message),
  }));
};
