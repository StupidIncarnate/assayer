/**
 * PURPOSE: Builds a valid ImportSpecifierResolveResult for tests
 *
 * USAGE:
 * ImportSpecifierResolveResultStub();
 * // Returns a valid ImportSpecifierResolveResult
 */

import { importSpecifierResolveResultContract } from "./import-specifier-resolve-result-contract";
import type { ImportSpecifierResolveResult } from "./import-specifier-resolve-result-contract";

export const ImportSpecifierResolveResultStub =
  (): ImportSpecifierResolveResult =>
    importSpecifierResolveResultContract.parse({ resolved: false });
