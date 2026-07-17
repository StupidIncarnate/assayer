import { specimenCatalogue } from '../../../../test/harnesses/specimen-catalogue';
import { specimenRegistry, uncataloguedTraits } from '../../../../test/harnesses/specimen-registry';
import { syntaxTraits } from '../../../../test/harnesses/syntax-traits';

// The colocated unit test feeds this broker hand-built walk results. This drives it across the WHOLE
// catalogue — every specimen on disk, real source, real walk — so a construct cannot be added to the
// repository and quietly go unanalyzed.
//
// The case list is WALKED off disk, never written down: a literal list of specimens goes stale the
// moment someone adds syntax, and goes stale silently.
const CATALOGUE_PATHS = specimenCatalogue().relPaths();
const SPECIMENS = CATALOGUE_PATHS.map((relPath) => String(relPath));

// Paired here rather than looked up inside a test, which may hold no conditionals.
const DECLARED = CATALOGUE_PATHS.map(
  (relPath) => [String(relPath), [...(specimenRegistry.get(relPath) ?? [])].sort()] as const,
);

// What the contracts model minus what the catalogue actually contains — computed outside the test
// for the same reason.
const COVERED = new Set(SPECIMENS.flatMap((relPath) => syntaxTraits().observed({ relPath })));
const UNCOVERED = syntaxTraits()
  .declaredByContracts()
  .filter((trait) => !COVERED.has(trait))
  .sort();

describe('analyzeFileBroker (integration)', () => {
  describe('the catalogue is well-formed', () => {
    // The one thing every specimen owes whatever it contains. Asked once here rather than re-authored
    // in all 15 colocated tests — a check copied everywhere is a check nobody adds to the next file.
    it.each(SPECIMENS)('VALID: {%s} => is valid TypeScript', (relPath) => {
      expect(specimenCatalogue().syntacticErrors({ relPath })).toStrictEqual([]);
    });
  });

  describe('the catalogue is fully declared', () => {
    // Nobody can add syntax without saying what it is. Without this a new specimen simply never
    // reaches the checks below — and a suite that skipped a file looks exactly like one that passed it.
    it('VALID: {every specimen on disk} => is declared in the registry', () => {
      expect(SPECIMENS).toStrictEqual([...specimenRegistry.keys()].map((relPath) => String(relPath)).sort());
    });
  });

  describe('what the analyzer sees matches what each specimen declares', () => {
    // THE linchpin, and it runs both directions. Declared-but-unseen is a regression: the analyzer
    // stopped understanding a construct. Seen-but-undeclared is a forgotten trait: someone changed a
    // specimen and did not say so.
    //
    // It is also why declarations trigger the checks and the analyzer merely audits them. Were the
    // matrix to ask the analyzer what is in a file, a broken analyzer would agree with itself, run
    // fewer checks, and go green — the same reason an expected value never comes from running the
    // implementation.
    it.each(DECLARED)('VALID: {%s} => the analyzer finds exactly the declared traits', (relPath, declared) => {
      expect(syntaxTraits().observed({ relPath })).toStrictEqual(declared);
    });
  });

  describe('the catalogue covers what the contracts model', () => {
    // "The smoke-repo represents every syntax we handle" is otherwise a claim with nothing behind it.
    // The expected side is the WRITTEN-DOWN gap list, so a construct falling out of coverage — or a
    // contract gaining a member nobody catalogued — fails here rather than going unnoticed. Closing a
    // gap means deleting its line, which is the ratchet.
    it('VALID: {every access and branch kind the contracts declare} => has a specimen, or is a declared gap', () => {
      expect(UNCOVERED).toStrictEqual(Object.keys(uncataloguedTraits).sort());
    });
  });

  describe('the analysis is deterministic', () => {
    // Same bytes, same analysis. The content-hash cache, the ref-to-ref diff and CI cold-start all
    // rest on this, and Map/Set ordering leaking into the output would break it invisibly.
    it.each(SPECIMENS)('VALID: {%s} => analyzing the same bytes twice yields an identical model', (relPath) => {
      expect(syntaxTraits().analyze({ relPath })).toStrictEqual(syntaxTraits().analyze({ relPath }));
    });
  });
});
