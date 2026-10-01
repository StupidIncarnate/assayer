/**
 * PURPOSE: Builds a valid FindReturnedPrivate for tests
 *
 * USAGE:
 * FindReturnedPrivateStub();
 * // Returns a valid FindReturnedPrivate
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { ScopeRecordStub } from "../scope-record/scope-record.stub";
import { CallSiteStub } from "../call-site/call-site.stub";

import { findReturnedPrivateContract } from "./find-returned-private-contract";
import type { FindReturnedPrivate } from "./find-returned-private-contract";

export const FindReturnedPrivateStub = ({
  ...props
}: StubArgument<FindReturnedPrivate> = {}): FindReturnedPrivate =>
  findReturnedPrivateContract.parse({
    privateScope: ScopeRecordStub(),
    call: CallSiteStub(),
    ...props,
  });
