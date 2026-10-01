/**
 * PURPOSE: One property row of an object stub card — the property's dotted name, then either an
 *   `unknown` badge (no reader branches on it) or one badge per demanded value. Reach for this over
 *   StubEnvCardLayerWidget's value row when the property can be unknown; an env stub always has values.
 *
 * USAGE:
 * <StubPropertyRowLayerWidget property={property} />
 * // Renders the property name followed by its value badges or an unknown badge
 */
import type { ReactElement } from '#gateway/npm/react';
import { Badge, Group, Text } from '#gateway/npm/mantine__core';

import { stubRepositoryStatics } from '../../statics/stub-repository/stub-repository-statics';
import type { flattenPropertyDemandTransformer } from '../../transformers/flatten-property-demand/flatten-property-demand-transformer';

export interface StubPropertyRowLayerWidgetProps {
  property: ReturnType<typeof flattenPropertyDemandTransformer>[number];
}

export const StubPropertyRowLayerWidget = ({ property }: StubPropertyRowLayerWidgetProps): ReactElement => (
  <Group data-testid="STUB_PROPERTY" data-propname={String(property.name)} gap="xs">
    <Text ff="monospace" fz="xs" c="gray.4">
      {String(property.name)}
    </Text>
    {property.demand.kind === 'unknown' ? (
      <Badge data-testid="STUB_UNKNOWN" color="gray" variant="outline" size="sm">
        {stubRepositoryStatics.unknownLabel}
      </Badge>
    ) : (
      property.demand.values.map((value) => (
        <Badge
          key={`${String(property.name)}:${JSON.stringify(value)}`}
          data-testid="STUB_PROPERTY_VALUE"
          color="blue"
          variant="light"
          size="sm"
        >
          {String(value)}
        </Badge>
      ))
    )}
  </Group>
);
