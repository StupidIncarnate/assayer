# Reparsing Architecture

## The Problem

Once AI fills in test stubs, the system must:
1. **Detect changes** in source files
2. **Reparse only affected sections** 
3. **Preserve AI-generated content** in existing tests
4. **Add new test cases** for new code paths
5. **Remove obsolete tests** for deleted code

## Architecture Decision: Embedded Metadata

**Chosen Approach**: Embed metadata directly in generated test files as comments.

### Rationale
- **Self-contained**: No separate files to lose or get out of sync
- **Robust**: Function-level tracking survives minor code changes
- **Simple**: Easy conflict resolution (function changed = regenerate stub)
- **Implementable**: Can be built and validated in Phase 1

## Metadata Format

```typescript
describe('calculateTotal', () => {
  // @generated-by: ast-parser v1.0.0
  // @source-hash: abc123def456
  // @last-updated: 2024-01-15T10:30:00Z
  // @covers: function calculateTotal(items: Item[]): number
  
  describe('when items is empty array', () => {
    // @generated-stub: task-1.2-parameter-analysis
    // @source-line: 42
    // @element-hash: def789ghi012
    it('should return zero', () => {
      // AI-filled content here - preserved during reparse
      expect(calculateTotal([])).toBe(0);
    });
  });
});
```

## Reparsing Logic

### Change Detection
```typescript
interface TestMetadata {
  sourceFile: string;
  sourceHash: string;
  generatedAt: string;
  parserVersion: string;
  coveredElements: {
    type: 'function' | 'branch' | 'jsx-element';
    name: string;
    sourceLocation: { line: number; column: number };
    hash: string;
  }[];
}

function detectChanges(sourceFile: string, metadata: TestMetadata): ChangeSet {
  const currentHash = hashFile(sourceFile);
  const currentAST = parseFile(sourceFile);
  
  return {
    addedElements: findNewElements(currentAST, metadata.coveredElements),
    modifiedElements: findModifiedElements(currentAST, metadata.coveredElements),
    removedElements: findRemovedElements(currentAST, metadata.coveredElements)
  };
}
```

### Surgical Updates
```typescript
function updateTestFile(testFile: string, changes: ChangeSet): void {
  // 1. Add new test stubs for new elements
  // 2. Mark obsolete tests as @deprecated (don't delete immediately)
  // 3. Update metadata comments with new hashes
  // 4. Preserve all AI-generated content inside test bodies
  // 5. Regenerate stubs for modified elements (lose AI content)
}
```

## Conflict Resolution Strategy

### Function-Level Granularity
- **Function unchanged**: Preserve all AI content
- **Function modified**: Regenerate stub structure, lose AI content
- **Function added**: Generate new stub
- **Function removed**: Mark test as @deprecated

### AI Content Preservation
```typescript
// Before reparse
it('should return zero', () => {
  // AI-filled content
  const items = [];
  const result = calculateTotal(items);
  expect(result).toBe(0);
  expect(result).toBeGreaterThanOrEqual(0);
});

// After reparse (function unchanged)
it('should return zero', () => {
  // AI-filled content - PRESERVED
  const items = [];
  const result = calculateTotal(items);
  expect(result).toBe(0);
  expect(result).toBeGreaterThanOrEqual(0);
});
```

## Implementation Requirements

### Phase 1: Task 1.5 - Reparsing Foundation
```typescript
// Must implement:
1. Metadata generation alongside test stubs
2. Source file hashing for change detection
3. Basic incremental update logic
4. Proof of concept for preserving AI content
```

### Key Functions Needed
```typescript
function generateTestStubWithMetadata(element: ASTElement): string;
function parseExistingTestMetadata(testFile: string): TestMetadata;
function updateTestFileIncrementally(testFile: string, changes: ChangeSet): void;
function preserveAIContent(testBlock: string): string;
```

## Validation Strategy

### Round-Trip Testing
1. Generate initial test stubs
2. Simulate AI filling in content
3. Modify source file
4. Reparse and verify AI content preserved
5. Add new functions and verify new stubs generated

### Edge Cases to Handle
- Multiple functions in same file
- Nested functions
- Generic functions
- Async functions
- Functions with complex parameter types
- Functions that are moved/renamed

## Risk Mitigation

### Backup Strategy
- Always backup original test file before reparsing
- Store metadata in multiple formats (comments + separate file)
- Version control integration for conflict resolution

### Recovery Options
- Fall back to full regeneration if incremental update fails
- Manual merge tools for complex conflicts
- Rollback capability to previous working state

## Success Criteria

- **Preservation**: AI-generated content survives source changes
- **Accuracy**: New code paths generate appropriate test stubs
- **Performance**: Incremental updates faster than full regeneration
- **Reliability**: No data loss during reparse operations
- **Usability**: Clear conflict resolution for edge cases