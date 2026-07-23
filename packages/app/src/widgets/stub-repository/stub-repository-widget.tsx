/**
 * PURPOSE: The stub-repository view — renders every stub in the merged StubView in isolation so a
 *   human can eyeball the whole repository. One CARD per stub: for an OBJECT stub its stable key
 *   (`<definitionRelPath>#<TypeName>`), the files that READ it, and each property with either its
 *   demanded values or an `unknown` badge (a property no reader branches on); for an ENV stub the
 *   `process.env#<PROP>` key, its values badged `guessed` (best-effort, human-correctable) or
 *   `corrected` (a committed human value the merge marked authoritative), and its readers.
 *
 *   Where the merged view CAN tell corrected from guessed it does — an env stub carries that on its
 *   `guessed` flag. An object property's demanded values are the derived-or-corrected union spliced by
 *   the read-time combine and are shown as-is; the view cannot tell which single value a human supplied.
 *
 * USAGE:
 * <StubRepositoryWidget />
 * // Renders the stub cards once the preload bridge resolves the merged stub view
 */
import type { ReactElement } from 'react';
import { Badge, Box, Card, Group, Stack, Text, Title } from '@mantine/core';

import { useStubIndexBinding } from '../../bindings/use-stub-index/use-stub-index-binding';
import { stubRepositoryStatics } from '../../statics/stub-repository/stub-repository-statics';

export const StubRepositoryWidget = (): ReactElement => {
  const { data, loading, error } = useStubIndexBinding();

  return (
    <Box data-testid="STUB_REPOSITORY" bg="dark.8" p="md" style={{ height: '100%', overflow: 'auto' }}>
      {error === null ? (
        loading ? (
          <Text data-testid="STUB_LOADING" c="dimmed" fz="sm">
            {stubRepositoryStatics.loadingMessage}
          </Text>
        ) : data === null || (data.objectStubs.length === 0 && data.envStubs.length === 0) ? (
          <Text data-testid="STUB_EMPTY" c="dimmed" fz="sm">
            {stubRepositoryStatics.emptyMessage}
          </Text>
        ) : (
          <Stack gap="lg">
          {data.objectStubs.length === 0 ? null : (
            <Box>
              <Title data-testid="STUB_OBJECTS_SECTION" order={4} c="gray.3" mb="xs">
                {stubRepositoryStatics.objectsHeading}
              </Title>
              <Stack gap="sm">
                {data.objectStubs.map((stub) => (
                  <Card
                    key={String(stub.key)}
                    data-testid="STUB_CARD"
                    data-stubkey={String(stub.key)}
                    withBorder
                    bg="dark.7"
                    padding="sm"
                  >
                    <Text data-testid="STUB_KEY" fw={600} ff="monospace" fz="sm" c="gray.1">
                      {String(stub.key)}
                    </Text>
                    <Stack gap={4} mt="xs">
                      {stub.properties.map((property) => (
                        <Group
                          key={String(property.name)}
                          data-testid="STUB_PROPERTY"
                          data-propname={String(property.name)}
                          gap="xs"
                        >
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
                      ))}
                    </Stack>
                    <Text fz="xs" c="dimmed" mt="xs">
                      {stubRepositoryStatics.readersHeading}
                    </Text>
                    {stub.readers.length === 0 ? (
                      <Text data-testid="STUB_NO_READERS" fz="xs" c="dimmed" fs="italic">
                        {stubRepositoryStatics.noReadersLabel}
                      </Text>
                    ) : (
                      stub.readers.map((reader) => (
                        <Text key={String(reader)} data-testid="STUB_READER" ff="monospace" fz="xs" c="gray.5">
                          {String(reader)}
                        </Text>
                      ))
                    )}
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
          {data.envStubs.length === 0 ? null : (
            <Box>
              <Title data-testid="STUB_ENV_SECTION" order={4} c="gray.3" mb="xs">
                {stubRepositoryStatics.envHeading}
              </Title>
              <Stack gap="sm">
                {data.envStubs.map((stub) => (
                  <Card
                    key={String(stub.key)}
                    data-testid="STUB_CARD"
                    data-stubkey={String(stub.key)}
                    withBorder
                    bg="dark.7"
                    padding="sm"
                  >
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
                        <Badge
                          key={JSON.stringify(value)}
                          data-testid="STUB_PROPERTY_VALUE"
                          color="blue"
                          variant="light"
                          size="sm"
                        >
                          {String(value)}
                        </Badge>
                      ))}
                    </Group>
                    <Text fz="xs" c="dimmed" mt="xs">
                      {stubRepositoryStatics.readersHeading}
                    </Text>
                    {stub.readers.length === 0 ? (
                      <Text data-testid="STUB_NO_READERS" fz="xs" c="dimmed" fs="italic">
                        {stubRepositoryStatics.noReadersLabel}
                      </Text>
                    ) : (
                      stub.readers.map((reader) => (
                        <Text key={String(reader)} data-testid="STUB_READER" ff="monospace" fz="xs" c="gray.5">
                          {String(reader)}
                        </Text>
                      ))
                    )}
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
          </Stack>
        )
      ) : (
        <Text data-testid="STUB_ERROR" c="red.4" fz="xs" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>
          {error.message}
        </Text>
      )}
    </Box>
  );
};
