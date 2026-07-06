/**
 * PURPOSE: The bundled, versioned assayer documentation catalog — LLM-consumable topic
 *   bodies served by `assayer docs <topic>`. Ships with the package so docs never drift
 *   from the installed version. Grows as topics are added.
 *
 * USAGE:
 * docsCatalogStatics.topics;
 * // Returns the ordered list of { key, body } documentation entries
 */
export const docsCatalogStatics = {
  topics: [
    {
      key: 'overview',
      body: 'Assayer statically identifies what should be tested, generates and runs the tests itself, and fails like a build error when something testable is uncovered or broken.',
    },
    {
      key: 'plugins',
      body: 'Assayer ships a lean core; per-technology obligations arrive as separate @assayer/* discipline and probe plugins that the core auto-detects and wires.',
    },
  ],
} as const;
