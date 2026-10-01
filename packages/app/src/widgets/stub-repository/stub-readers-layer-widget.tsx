/**
 * PURPOSE: The readers block at the foot of a stub card — the heading, then one line per file that
 *   reads the stub, or an italic "no readers" line. Both stub card kinds end with it, so the two
 *   cards cannot word it differently.
 *
 * USAGE:
 * <StubReadersLayerWidget readers={stub.readers} />
 * // Renders the readers heading and each reader path
 */
import type { ReactElement } from '#gateway/npm/react';
import { Text } from '#gateway/npm/mantine__core';
import type { ObjectStub } from '@assayer/shared/contracts';

import { stubRepositoryStatics } from '../../statics/stub-repository/stub-repository-statics';

export interface StubReadersLayerWidgetProps {
  readers: ObjectStub['readers'];
}

export const StubReadersLayerWidget = ({ readers }: StubReadersLayerWidgetProps): ReactElement => (
  <>
    <Text fz="xs" c="dimmed" mt="xs">
      {stubRepositoryStatics.readersHeading}
    </Text>
    {readers.length === 0 ? (
      <Text data-testid="STUB_NO_READERS" fz="xs" c="dimmed" fs="italic">
        {stubRepositoryStatics.noReadersLabel}
      </Text>
    ) : (
      readers.map((reader) => (
        <Text key={String(reader)} data-testid="STUB_READER" ff="monospace" fz="xs" c="gray.5">
          {String(reader)}
        </Text>
      ))
    )}
  </>
);
