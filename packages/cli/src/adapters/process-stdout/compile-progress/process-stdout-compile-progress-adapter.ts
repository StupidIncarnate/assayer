/**
 * PURPOSE: Renders a CompileProgressEvent stream to process.stdout as one progress bar per
 *   namespace (stable branch first, current branch second — first-seen order is stable),
 *   redrawing every bar line each time an event arrives.
 *
 * USAGE:
 * const controller = processStdoutCompileProgressAdapter();
 * await compileRunBroker({ ..., onProgress: (event) => controller.render({ event }) });
 * // Writes 'Assayer is updating caches\n' once, then one progress-bar line per namespace,
 * // in first-seen order, on every event.
 */
import type { CompileProgressEvent } from '@assayer/core/contracts';
import type { NamespaceName, BranchName, FileCount } from '@assayer/shared/contracts';

import { progressBarLineFormatTransformer } from '../../../transformers/progress-bar-line-format/progress-bar-line-format-transformer';

export const processStdoutCompileProgressAdapter = (): {
  render: ({ event }: { event: CompileProgressEvent }) => void;
} => {
  let headerWritten = false;
  let previousLineCount = 0;
  const order: NamespaceName[] = [];
  const bars = new Map<NamespaceName, { label: BranchName; current: FileCount; max: FileCount }>();

  return {
    render: ({ event }: { event: CompileProgressEvent }): void => {
      if (!headerWritten) {
        process.stdout.write('Assayer is updating caches\n');
        headerWritten = true;
      }

      const isNewNamespace = !bars.has(event.namespace);
      bars.set(event.namespace, { label: event.branch, current: event.current, max: event.max });
      if (isNewNamespace) {
        order.push(event.namespace);
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
