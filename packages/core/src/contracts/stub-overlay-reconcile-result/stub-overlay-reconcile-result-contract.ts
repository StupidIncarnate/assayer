/**
 * PURPOSE: Defines the data `stubOverlayReconcileBroker` returns
 *
 * USAGE:
 * stubOverlayReconcileResultContract.parse(value);
 * // Returns validated StubOverlayReconcileResult
 */
import { z } from "#gateway/npm/zod";

export const stubOverlayReconcileResultContract = z
  .array(
    z
      .object({
        relPath: z.string().brand<"StubOverlayReconcileResultRelPath">(),
        line: z.number().brand<"StubOverlayReconcileResultLine">(),
        column: z.number().brand<"StubOverlayReconcileResultColumn">(),
        message: z.string().brand<"StubOverlayReconcileResultMessage">(),
      })
      .brand<"StubOverlayReconcileResult">(),
  )
  .readonly();

export type StubOverlayReconcileResult = z.infer<
  typeof stubOverlayReconcileResultContract
>;
