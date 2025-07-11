# Incremental Output Strategy

## Core Principle

**Every metadata extraction task immediately generates test cases.** No theoretical work - only practical output that compiles and runs.

## Task-Level Output Examples

### Task 1.1: Parse TypeScript Function Declarations
```typescript
// Input: function calculateTotal(items: Item[]): number
// Immediate Output:
describe('calculateTotal', () => {
  it('should [AI fills behavior]', () => {
    // Arrange: [AI fills setup]
    // Act: const result = calculateTotal(/* [AI fills params] */);
    // Assert: [AI fills expectations]
  });
});
```

### Task 1.2: Extract Function Parameters and Types
```typescript
// Discovers: items: Item[], returns: number
// Immediate Output Enhancement:
describe('calculateTotal', () => {
  describe('when items is empty array', () => {
    it('should [AI fills behavior]', () => {});
  });
  describe('when items contains valid Item objects', () => {
    it('should [AI fills behavior]', () => {});
  });
  describe('when items is null/undefined', () => {
    it('should [AI fills behavior]', () => {});
  });
});
```

### Task 2.1: Detect If/Else Statements
```typescript
// Input: if (user.isAdmin) { return adminView; } else { return userView; }
// Immediate Output Addition:
describe('when user.isAdmin is true', () => {
  it('should [AI fills admin behavior]', () => {});
});
describe('when user.isAdmin is false', () => {
  it('should [AI fills user behavior]', () => {});
});
```

## Cumulative Enhancement Strategy

Each task **enhances** the same test file:
- Task 1.1 creates skeleton
- Task 1.2 adds parameter variations
- Task 2.1 adds branch coverage
- Task 2.2 adds ternary coverage
- Task 3.1 adds JSX testing
- etc.

## Validation Pipeline

After each task:
1. **Compile Check**: Generated test file must compile
2. **Run Check**: Tests must execute without import errors
3. **Structure Check**: Follows DAMP conventions
4. **Coverage Check**: New metadata translates to new test cases
5. **Regression Check**: Previous task outputs still work
6. **Reparse Check**: Metadata enables incremental updates

## Benefits

- **Immediate Feedback**: See if metadata extraction translates to useful test cases
- **Continuous Validation**: Each task proves its value through executable output
- **Early Problem Detection**: Discover template issues or missing edge cases quickly
- **Stakeholder Confidence**: Working test files after every task completion
- **Risk Mitigation**: Catch fundamental flaws when they're cheap to fix

## Template Preservation

Generated test files include metadata for reparsing:
```typescript
describe('calculateTotal', () => {
  // @generated-by: ast-parser v1.0.0
  // @source-hash: abc123def456
  // @last-updated: 2024-01-15T10:30:00Z
  // @covers: function calculateTotal(items: Item[]): number
  
  describe('when items is empty array', () => {
    // @generated-stub: task-1.2-parameter-analysis
    // @source-line: 42
    it('should return zero', () => {
      // AI-filled content preserved here
    });
  });
});
```

## Quality Gates

- Generated tests must compile without errors
- All identified metadata must have corresponding test stubs
- Template structure must be consistent across tasks
- Performance: <30s generation time for largest components
- Reparse capability must work without losing AI content