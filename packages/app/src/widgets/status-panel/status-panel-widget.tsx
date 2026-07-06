/**
 * PURPOSE: Renders the assayer status handshake — version, readiness message, and target repo
 *   path — from the status binding, with loading/error/empty states.
 *
 * USAGE:
 * <StatusPanelWidget />
 * // Renders the status card once the bridge resolves
 */
import type { ReactElement } from 'react';
import { Alert, Card, Loader, Stack, Text, Title } from '@mantine/core';

import { useAssayerStatusBinding } from '../../bindings/use-assayer-status/use-assayer-status-binding';

export const StatusPanelWidget = (): ReactElement => {
  const { data, loading, error } = useAssayerStatusBinding();

  if (loading) {
    return <Loader data-testid="STATUS_LOADING" />;
  }

  if (error !== null) {
    return (
      <Alert color="red" title="Assayer error" data-testid="STATUS_ERROR">
        {error.message}
      </Alert>
    );
  }

  if (data === null) {
    return <Text data-testid="STATUS_EMPTY">No status available.</Text>;
  }

  return (
    <Card withBorder padding="lg" data-testid="STATUS_PANEL">
      <Stack gap="xs">
        <Title order={2}>Assayer {data.version}</Title>
        <Text data-testid="STATUS_MESSAGE">{data.message}</Text>
        <Text c="dimmed" data-testid="STATUS_REPO">
          Repo: {data.repoPath}
        </Text>
      </Stack>
    </Card>
  );
};
