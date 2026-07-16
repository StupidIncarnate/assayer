/**
 * PURPOSE: Renders a CompileProgressEvent stream to process.stdout as one progress bar per
 *   namespace (stable branch first, current branch second — first-seen order is stable),
 *   redrawing every bar line each time an event arrives.
 *
 *   It renders NOTHING until a file is actually compiled (the first `reused: false` event). The
 *   working-tree namespace re-reads and re-hashes every file every run — it has no commit to diff
 *   against — so events arrive for files nobody touched, and announcing "updating caches" for them
 *   claimed work that never happened. A run that writes nothing now says nothing, which is what
 *   makes the announcement worth reading when it does appear.
 *
 * USAGE:
 * const controller = processStdoutCompileProgressAdapter();
 * await compileRunBroker({ ..., onProgress: (event) => controller.render({ event }) });
 * // Writes 'Assayer is updating caches\n' once a file is genuinely compiled, then one
 * // progress-bar line per namespace, in first-seen order, on every subsequent event.
 */
import type { CompileProgressEvent } from '@assayer/core/contracts';
import type { NamespaceName, BranchName, FileCount } from '@assayer/shared/contracts';

import { progressBarLineFormatTransformer } from '../../../transformers/progress-bar-line-format/progress-bar-line-format-transformer';

export const processStdoutCompileProgressAdapter = (): {
  render: ({ event }: { event: CompileProgressEvent }) => void;
} => {
  let headerWritten = false;
  let compiledAnything = false;
  let previousLineCount = 0;
  const order: NamespaceName[] = [];
  const bars = new Map<NamespaceName, { label: BranchName; current: FileCount; max: FileCount }>();

  return {
    render: ({ event }: { event: CompileProgressEvent }): void => {
      // Recorded even while silent, so a namespace whose events all arrived before the first compile
      // still has its bar when drawing starts — suppressing the write must not lose the namespace.
      const isNewNamespace = !bars.has(event.namespace);
      bars.set(event.namespace, { label: event.branch, current: event.current, max: event.max });
      if (isNewNamespace) {
        order.push(event.namespace);
      }

      // Only an 'advanced' event that WROTE something starts the output. Explicitly `=== false`:
      // 'planned' and 'done' carry no `reused` at all, and a bare truthiness check would read their
      // silence on the question as an answer of "compiled" — announcing before any file was touched.
      compiledAnything ||= event.reused === false;

      // Events carry the ABSOLUTE count, so the first bar drawn is still true (8/15, not 1/15) even
      // though the reused files ahead of it drew nothing.
      if (!compiledAnything) {
        return;
      }

      if (!headerWritten) {
        process.stdout.write('Assayer is updating caches\n');
        headerWritten = true;
      }

      const isTty = process.stdout.isTTY;
      if (isTty && previousLineCount > 0) {
        process.stdout.write(`[${previousLineCount}A`);
      }

      order.forEach((seenNamespace) => {
        const bar = bars.get(seenNamespace);
        if (bar === undefined) {
          return;
        }
        const line = progressBarLineFormatTransformer({
          label: bar.label,
          current: bar.current,
          max: bar.max,
        });
        process.stdout.write(`${line}\n`);
      });

      previousLineCount = order.length;
    },
  };
};
