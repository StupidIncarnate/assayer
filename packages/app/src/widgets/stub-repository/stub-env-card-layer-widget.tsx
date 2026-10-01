/**
 * PURPOSE: One card for a `process.env` stub — its key with a `guessed` or `corrected` badge, its
 *   values, and the files that read it. Reach for StubObjectCardLayerWidget instead for a stubbed
 *   object type, which has many properties and can mark one unknown.
 *
 * USAGE:
 * <StubEnvCardLayerWidget stub={stub} />
 * // Renders the env key, its guessed/corrected badge, its value badges and its readers
 */
import type { ReactElement } from 'react';
import { Badge, Card, Group, Text } from '@mantine/core';
import type { EnvStub } from '@assayer/shared/contracts';

import { stubRepositoryStatics } from '../../statics/stub-repository/stub-repository-statics';
import { StubReadersLayerWidget } from './stub-readers-layer-widget';

export interface StubEnvCardLayerWidgetProps {
  stub: EnvStub;
}

export const StubEnvCardLayerWidget = ({ stub }: StubEnvCardLayerWidgetProps): ReactElement => (
  <Card data-testid="STUB_CARD" data-stubkey={String(stub.key)} withBorder bg="dark.7" padding="sm">
    <Group gap="xs">
      <Text data-testid="STUB_KEY" fw={600} ff="monospace" fz="sm" c="gray.1">
        {String(stub.key)}
      </Text>
      {stub.guessed ? (
        <Badge data-testid="STUB_GUESSED" color="yellow" variant="light" size="sm">
          {stubRepositoryStatics.guessedLabel}
        </Badge>
      ) : (
        <Badge data-testid="STUB_CORRECTED" color="green" variant="light" size="sm">
          {stubRepositoryStatics.correctedLabel}
        </Badge>
      )}
    </Group>
    <Group data-testid="STUB_PROPERTY" data-propname={String(stub.property)} gap="xs" mt="xs">
      {stub.values.map((value) => (
        <Badge key={JSON.stringify(value)} data-testid="STUB_PROPERTY_VALUE" color="blue" variant="light" size="sm">
          {String(value)}
        </Badge>
      ))}
    </Group>
    <StubReadersLayerWidget readers={stub.readers} />
  </Card>
);
