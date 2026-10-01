/**
 * PURPOSE: Builds a valid CauseArrange for tests
 *
 * USAGE:
 * CauseArrangeStub();
 * // Returns a valid CauseArrange
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";

import { causeArrangeContract } from "./cause-arrange-contract";
import type { CauseArrange } from "./cause-arrange-contract";

export const CauseArrangeStub = ({
  ...props
}: StubArgument<CauseArrange> = {}): CauseArrange =>
  causeArrangeContract.parse({
    unreachable: false,
    arrangements: [],
    unfillable: [],
    ...props,
  });
