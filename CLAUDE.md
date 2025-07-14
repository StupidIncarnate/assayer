# Assayer 

## Environment

- **Project Type**: AST-based test stub generator for TypeScript/React
- **Node Version**: ES2016+ (based on TypeScript target)
- **TypeScript Version**: ^5.5.3
- **Test Framework**: Jest ^30.0.4
- **Linting**: ESLint ^9.30.1
- **Build Target**: CommonJS modules in dist/
- **Primary Purpose**: Parse TypeScript/JSX files and generate comprehensive test stubs with 100% branch coverage

## Project Context

Assayer is a deterministic testing tool that addresses the unreliability of AI-based code analysis. It uses the TypeScript Compiler API to parse source files, identify all testable code paths and branches, then generates executable test stubs. The key insight is moving intelligence from AI (unreliable) to AST parsing (deterministic), using AI only for filling pre-structured test stubs.

## Testing Standards

### Test Framework Configuration

**Jest Configuration**:
- Test environment: Node.js
- Coverage collection from: `src/**/*.{ts,tsx}`
- Test file patterns: `*.{test}.{ts,tsx}`
- Module path mapping: `@/` → `src/`
- Setup file: `jest.setup.js`
- Transform: Uses babel-jest (requires babel configuration to be added)

**Coverage Requirements**:
- Minimum coverage: 100% (to be enforced)

### Test File Organization

```
src/
├── component.ts
├── component.test.ts       # Unit tests
└── __tests__/
    └── component.test.ts   # Alternative location
```

### Test Naming Conventions

**Test Files**:
- Unit tests: `[name].test.ts`
- Integration tests: `[name].integration.test.ts`
- Place tests next to source files or in `__tests__` directories

**Test Suites**:
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle specific scenario', () => {
      // Test implementation
    });
  });
});
```

### Testing Patterns

**DAMP Principle**: Tests should be Descriptive And Meaningful Phrases
- Each test should be self-contained and readable
- Avoid excessive DRY in tests - clarity over brevity
- Include setup, action, and assertion phases

**Branch Coverage Focus**:
- Test all if/else branches
- Cover all switch cases
- Test ternary operators both ways
- Cover optional chaining scenarios
- Test try/catch blocks
- Verify dynamic JSX values
- Test conditional rendering
- Cover all event handlers

### Mock and Stub Patterns

Since Assayer will work with the TypeScript Compiler API:
```typescript
// Mock TypeScript compiler types
jest.mock('typescript', () => ({
  createSourceFile: jest.fn(),
  SyntaxKind: { /* mock syntax kinds */ }
}));
```

## Core Development Principles

### No Redundancy
- **Never** have multiple components doing the same thing
- If two pieces of code serve the same purpose, consolidate them
- One clear way to do each thing

### Code Cleanliness
- No orphaned files or unused code
- No commented-out code blocks
- No TODO comments in completed work
- No console.log statements in tests (unless specifically testing console output)

### Consistency First
- If there's an existing pattern, follow it
- Don't introduce new patterns without removing old ones
- Same problem = same solution throughout codebase

### Complete Work
- A task isn't done until:
  - All tests pass
  - No TypeScript errors
  - No linting warnings
  - No test output spam
  - All related code is updated
  - No loose ends

### Obvious Architecture
- Code organization should be self-evident
- No confusing dual-purpose components
- Clear single responsibility
- If you have to explain why something exists, it probably shouldn't

## Code Standards

### TypeScript Configuration

**Compiler Options**:
- Target: ES2016
- Module: CommonJS
- Strict mode: Enabled (all strict checks)
- ESM Interop: Enabled
- Output directory: `dist/`

**Type Safety Requirements**:
- No implicit any
- Strict null checks
- Strict function types
- No implicit this
- Consistent casing in file names

### ESLint Rules

**Current Configuration**:
- Base: @eslint/js/recommended
- Environment: Node.js, ES2022
- no-unused-vars: Warning level
- no-console: Allowed (for development)

**Additional Recommended Rules**:
```json
{
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "warn",
    "prefer-const": "error"
  }
}
```

### File Structure Standards

**Source Organization**:
```
src/
├── index.ts                 # Main entry point
├── ast/                     # AST parsing modules
│   ├── parser.ts
│   ├── traversal.ts
│   └── types.ts
├── analysis/                # Branch detection logic
│   ├── branch-detector.ts
│   ├── jsx-analyzer.ts
│   └── coverage-mapper.ts
├── generation/              # Test stub generation
│   ├── stub-generator.ts
│   ├── templates/
│   └── file-writer.ts
└── utils/                   # Shared utilities
```

### Coding Conventions

**Naming**:
- Files: kebab-case (`branch-detector.ts`)
- Classes: PascalCase (`BranchDetector`)
- Functions/Variables: camelCase (`detectBranches`)
- Constants: UPPER_SNAKE_CASE (`MAX_DEPTH`)
- Interfaces: PascalCase with 'I' prefix optional (`IBranchInfo` or `BranchInfo`)

**Imports**:
- Use consistent type imports: `import type { Type } from 'module'`
- Group imports: external deps, internal modules, types
- Use path aliases: `@/` for src directory

**Function Design**:
- Keep functions focused and single-purpose
- Prefer pure functions for AST analysis
- Document complex algorithms with JSDoc
- Use explicit return types

### Git Workflow

**Branch Naming**:
- Feature: `feature/ast-parser-implementation`
- Fix: `fix/branch-detection-edge-case`
- Refactor: `refactor/stub-generation-optimization`

**Commit Messages**:
- Use conventional commits format
- Examples:
  - `feat: add TypeScript AST parser module`
  - `fix: handle JSX fragment branch detection`
  - `test: add coverage for switch statement analysis`
  - `docs: update stub generation examples`

## Development Workflow

### Build Process

```bash
npm run build        # Compile TypeScript to dist/
npm run lint         # Run ESLint checks
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Pre-commit Checks

Before committing:
1. Run `npm run lint` - Fix any linting errors
2. Run `npm run test` - Ensure all tests pass
3. Run `npm run build` - Verify TypeScript compilation
4. Check coverage if working on core modules

### Missing Configuration

**Required Setup**:
1. Add Babel configuration for Jest transform
2. Consider adding TypeScript ESLint parser
3. Add pre-commit hooks (husky + lint-staged)
4. Configure coverage thresholds in Jest

## Architecture Guidelines

### Core Module Responsibilities

**AST Parser Module**:
- Parse TypeScript/JSX using Compiler API
- Build traversable AST representation
- Handle syntax errors gracefully

**Branch Detector Module**:
- Identify all conditional branches
- Map JSX dynamic content
- Track branch coverage requirements

**Stub Generator Module**:
- Generate DAMP test structures
- Create type-safe test stubs
- Output executable Jest/Vitest files

### Performance Considerations

- Cache parsed ASTs for large files
- Stream file generation for memory efficiency
- Parallelize analysis where possible
- Target <30 second generation per component

### Error Handling

- Graceful degradation for unparseable files
- Clear error messages with file context
- Recoverable parsing with partial results
- Detailed logs for debugging

## Quality Metrics

**Code Quality**:
- TypeScript strict mode compliance
- ESLint rule compliance
- 100% test coverage
