/**
 * PURPOSE: Builds a valid ExternalSignatureReadDeclarationResult for tests
 *
 * USAGE:
 * ExternalSignatureReadDeclarationResultStub();
 * // Returns a valid ExternalSignatureReadDeclarationResult
 */
import { ExternalSignatureStub } from "@assayer/shared/contracts/external-signature/external-signature.stub";

import { externalSignatureReadDeclarationResultContract } from "./external-signature-read-declaration-result-contract";
import type { ExternalSignatureReadDeclarationResult } from "./external-signature-read-declaration-result-contract";

export const ExternalSignatureReadDeclarationResultStub =
  (): ExternalSignatureReadDeclarationResult =>
    externalSignatureReadDeclarationResultContract.parse({
      usable: true,
      signature: ExternalSignatureStub(),
    });
