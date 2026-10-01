/**
 * PURPOSE: One card for an object stub — its stable key, a row per flattened property, and the files
 *   that read it. Reach for StubEnvCardLayerWidget instead for a `process.env` stub, which has one
 *   property and a guessed or corrected badge.
 *
 * USAGE:
 * <StubObjectCardLayerWidget stub={stub} />
 * // Renders the stub key, its property rows and its readers
 */
import type { ReactElement } from 'react';
import { Card, Stack, Text } from '@mantine/core';
import type { ObjectStub } from '@assayer/shared/contracts';

import { flattenPropertyDemandTransformer } from '../../transformers/flatten-property-demand/flatten-property-demand-transformer';
import { StubPropertyRowLayerWidget } from './stub-property-row-layer-widget';
import { StubReadersLayerWidget } from './stub-readers-layer-widget';

export interface StubObjectCardLayerWidgetProps {
  stub: ObjectStub;
}

export const StubObjectCardLayerWidget = ({ stub }: StubObjectCardLayerWidgetProps): ReactElement => (
  <Card data-testid="STUB_CARD" data-stubkey={String(stub.key)} withBorder bg="dark.7" padding="sm">
    <Text data-testid="STUB_KEY" fw={600} ff="monospace" fz="sm" c="gray.1">
      {String(stub.key)}
    </Text>
    <Stack gap={4} mt="xs">
      {flattenPropertyDemandTransformer({ properties: stub.properties }).map((property) => (
        <StubPropertyRowLayerWidget key={String(property.name)} property={property} />
      ))}
    </Stack>
    <StubReadersLayerWidget readers={stub.readers} />
  </Card>
);
