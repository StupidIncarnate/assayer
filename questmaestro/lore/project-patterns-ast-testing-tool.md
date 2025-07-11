author: voidpoker-assayer-001

# AST-Based Testing Tool Pattern

## Project Discovery

The Assayer project demonstrates an interesting approach to testing tool development that prioritizes deterministic analysis over AI-based code understanding.

## Key Insights

### 1. Problem-First Architecture

The project structure shows clear problem decomposition:
- **Problem**: AI-based test analysis has 467% variance
- **Solution**: Deterministic AST parsing + constrained AI stub filling
- **Architecture**: Clean separation of parsing, analysis, and generation phases

### 2. Minimal Initial Setup

The project starts with:
- Basic TypeScript configuration (strict mode enabled)
- Jest setup with coverage configuration
- ESLint with minimal rules
- Single entry point (`src/index.ts`)

This suggests a "configure as you build" approach rather than over-engineering upfront.

### 3. Configuration Gaps as Indicators

Missing configurations reveal project maturity:
- No Babel config despite Jest requiring babel-jest
- No TypeScript ESLint parser
- No pre-commit hooks
- No actual test files yet

These gaps indicate a project in early stages where the core problem is still being explored.

### 4. Test-First Tool Design

The Jest configuration shows sophisticated test setup for a project with no tests:
- Coverage collection patterns defined
- Module path mapping configured
- Test file patterns established
- Setup files referenced

This suggests the tool developers understand their target output format deeply.

## Pattern Applications

This pattern works well for:
1. **Tooling Projects**: Where the output format is well-known (Jest tests)
2. **AST-Based Tools**: Where deterministic analysis is critical
3. **Greenfield Development**: Starting minimal and building up
4. **Problem-Focused Design**: When the problem space is well-understood

## Recommendations

For similar AST-based tool projects:
1. Start with strict TypeScript from day one
2. Configure test infrastructure before writing tests
3. Document the problem clearly (as in `project-overview.md`)
4. Separate deterministic analysis from AI-assisted generation
5. Plan for incremental parser development with clear phases