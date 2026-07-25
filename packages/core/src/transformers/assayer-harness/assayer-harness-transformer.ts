/**
 * PURPOSE: The PUBLISHED registration seam a colocated harness calls — `assayerHarness` as a consumer
 *   imports it. It validates the authored declaration through its contract and hands it back to the
 *   collector that evaluated the file, which is what makes a harness register BY BEING CALLED rather
 *   than by exporting anything: the module body runs, the call happens, and the loader that ran it
 *   holds the result.
 *
 *   The collector is supplied by whoever loads the harness, never held here. At compile time the
 *   harness stitch evaluates the file in a sandbox whose only reachable import is this function bound
 *   to the stitch's own list; at run time the shim loads the same file the same way. One function
 *   validating both loads is what stops the cached key inventory and the live values disagreeing about
 *   what the file declared.
 *
 *   It is IMPORTED rather than an ambient global so the author is type-checked in their editor: a key
 *   spelled wrong is a structural error where they are typing, not a build error minutes later.
 *
 * USAGE:
 * assayerHarnessTransformer({ inputs: { audit: { report: (m: string): string => m } } });
 * // Returns the validated HarnessDeclaration — values pass through by reference
 */
import { harnessDeclarationContract } from '../../contracts/harness-declaration/harness-declaration-contract';
import type { HarnessDeclaration } from '../../contracts/harness-declaration/harness-declaration-contract';

export const assayerHarnessTransformer = ({ inputs }: HarnessDeclaration): HarnessDeclaration =>
  harnessDeclarationContract.parse({ inputs });
