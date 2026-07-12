/**
 * PURPOSE: Contract for extracting the `issues` array out of a caught Zod validation error —
 *   lets a catch block turn an `unknown` thrown value into a typed list of { path, message }
 *   without importing Zod's own error class into a responder.
 *
 * USAGE:
 * try {
 *   assayerConfigContract.parse(rawConfig);
 * } catch (error) {
 *   const { issues } = zodIssueListContract.parse(error);
 *   // issues: [{ path: ['repoRoot'], message: 'Expected string, received number' }, ...]
 * }
 */
import { z } from 'zod';

export const zodIssueListContract = z.object({
  issues: z.array(
    z.object({
      path: z.array(
        z.union([z.string().brand<'ZodIssuePathSegment'>(), z.number().brand<'ZodIssuePathSegment'>()]),
      ),
      message: z.string().brand<'ZodIssueMessage'>(),
    }),
  ),
});

export type ZodIssueList = z.infer<typeof zodIssueListContract>;
