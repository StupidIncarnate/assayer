/**
 * PURPOSE: Builds a valid StubOverlayReconcileResult for tests
 *
 * USAGE:
 * StubOverlayReconcileResultStub();
 * // Returns a valid StubOverlayReconcileResult
 */

import { stubOverlayReconcileResultContract } from "./stub-overlay-reconcile-result-contract";
import type { StubOverlayReconcileResult } from "./stub-overlay-reconcile-result-contract";

export const StubOverlayReconcileResultStub = (): StubOverlayReconcileResult =>
  stubOverlayReconcileResultContract.parse([]);
