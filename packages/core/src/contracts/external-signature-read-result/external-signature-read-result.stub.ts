/**
 * PURPOSE: Builds a valid ExternalSignatureReadResult for tests
 *
 * USAGE:
 * ExternalSignatureReadResultStub();
 * // Returns a valid ExternalSignatureReadResult
 */
import { ExternalSignatureStub } from "@assayer/shared/contracts/external-signature/external-signature.stub";

import { externalSignatureReadResultContract } from "./external-signature-read-result-contract";
import type { ExternalSignatureReadResult } from "./external-signature-read-result-contract";

export const ExternalSignatureReadResultStub =
  (): ExternalSignatureReadResult =>
    externalSignatureReadResultContract.parse({
      usable: true,
      signature: ExternalSignatureStub(),
    });
