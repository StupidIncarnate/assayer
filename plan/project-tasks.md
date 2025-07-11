# Assayer - AST-Based Test Generator - Atomic Task Breakdown

## Project Overview

**Project Name**: Assayer - named after metallurgists who test the purity of precious metals, this tool "assays" your TypeScript code to ensure complete test coverage.

**Problem**: AI-based code analysis is unreliable (467% variance in violation detection), and traditional coverage tools like Istanbul only measure what executed, not what needs testing.

**Solution**: Build a deterministic AST-based tool called Assayer that parses TypeScript/React code, identifies all logical branches, then generates test stubs with specific input values designed to trigger each branch.

**Core Innovation**: We find every if/else, switch case, and conditional in your code and generate the exact test inputs needed to execute each path. We don't predict outputs - we just ensure every branch gets tested.

**Output**: Executable Jest test files with one test per branch, using inputs that trigger that specific path. Assertions are left as TODOs for developers/AI to complete.

## Quick Start Guide

1. Start with Phase 1, Task 1.1 - Set up the basic project structure
2. Each task builds on the previous one - complete them in order
3. Every parsing task MUST immediately generate test output (not just parse)
4. Test your output after each task - generated tests must compile and run
5. The final result will be an npm package called `assayer` that can be installed and used as a CLI tool

## Key Definitions

**Test Stub**: A test case with the structure and setup code but placeholder assertions marked with TODO comments for AI/developer completion.

**Branch Coverage**: Testing all possible code paths through if/else, ternary, switch statements. Each condition creates a "branch" that needs a test.

**DAMP Principle**: "Descriptive And Meaningful Phrases" - test names should clearly describe what they test, even if it means some repetition.

**Testability**: Whether a code path can be triggered by manipulating function inputs or mocking dependencies. Internal-only branches are "untestable".

**AST (Abstract Syntax Tree)**: The tree structure that represents source code. We use TypeScript's compiler API to parse and traverse this tree.

## Implementation Philosophy

**Incremental Test Generation**: Each metadata extraction task immediately generates test cases. No waterfall - every task produces working, compilable test output.

**CRITICAL REQUIREMENT**: When implementing any syntax parsing task, that task MUST generate test stubs for the parsed syntax before the task is considered complete. This is not optional - it's the core validation that the parser works correctly.

**Bottom-Up Dependency-Driven Development**: Start with zero-dependency functions, build complexity incrementally.

**Plugin Architecture**: Core parser remains framework-agnostic with pluggable support for React/JSX and Jest templates.

## Complexity Levels Within Each Phase

### Testability Complexity
Each phase handles different levels of testability complexity:

**Level 1: Direct Testability**
- **What**: Code paths directly controllable via function parameters
- **Example**: `if (age > 18)` where age is a parameter
- **Test Strategy**: Simple input variation

**Level 2: Mockable Dependencies**
- **What**: Code paths that depend on external calls that can be mocked
- **Example**: `if (await userService.isActive(id))` 
- **Test Strategy**: Mock injection required

**Level 3: Internal State Dependencies**
- **What**: Code paths that depend on internal transformations
- **Example**: Internal variables computed from multiple sources
- **Test Strategy**: May require refactoring for testability

### Branch Complexity
Within control flow analysis, branches have varying complexity:

**Simple Branches**
- Single condition: `if (x > 0)`
- Direct parameter dependency
- Clear true/false paths

**Compound Branches**
- Multiple conditions: `if (x > 0 && y < 10)`
- Optional chaining: `if (user?.profile?.age)`
- Requires combination testing

**Nested Branches**
- Branches within branches
- Switch statements with multiple cases
- Exponential path combinations

### Component Complexity (React Phase)
When parsing React components:

**Stateless Components**
- Props in, JSX out
- No hooks or state
- Example: `<Button label={text} />`

**Stateful Components**
- Uses hooks (useState, useEffect)
- Internal state management
- Example: `<Form onSubmit={handleSubmit} />`

**Context-Dependent Components**
- Relies on React Context
- Multiple provider dependencies
- Example: `<AuthenticatedRoute />`

## Atomic Task Structure

Each task must be:
1. **Single Responsibility**: One AST node type or template pattern
2. **Testable in Isolation**: Validated without dependencies
3. **Measurable Success**: Clear pass/fail criteria
4. **Incremental**: Builds on previous tasks only
5. **Immediate Output**: Generates working test stubs that compile and run
6. **Cumulative Enhancement**: Each task enhances the same test file rather than creating separate outputs


## MVP Scope

**Core MVP Phases**:
- Phase 1: Foundation (basic setup, simple function parsing)
- Phase 2: Templates and parameter handling
- Phase 3: Control flow (if/else, loops, try/catch)
- Phase 4: Classes and objects
- Phase 5: React/JSX support
- Phase 6: Test generation strategies
- Phase 7: CLI and configuration
- Phase 8: Caching and incremental updates
- Phase 9: NPM packaging and distribution
- Phase 10: Advanced patterns (async, generics)

**Post-MVP Extensions**: Vue, Angular, Svelte plugins + Vitest, Playwright, Mocha support

## Implementation Phases

**Timeline: Core MVP phases + Advanced features**

### Phase 1: Foundation and Basic Parser
*Establish core infrastructure and implement basic function parsing to validate the architecture*

Task 1.1: Project setup and TypeScript Compiler API basics
  - Run `npm init -y` and install: typescript, ts-morph, @types/node, jest, @types/jest, ts-jest
  - Create tsconfig.json with: 
    ```
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "strict": true,
        "esModuleInterop": true,
        "outDir": "./dist",
        "rootDir": "./src"
      }
    }
    ```
  - Add package.json scripts:
    ```
    "scripts": {
      "build": "tsc",
      "test": "jest",
      "lint": "tsc --noEmit"
    }
    ```
  - Create jest.config.js: `module.exports = { preset: 'ts-jest', testEnvironment: 'node' };`
  - Create folders: src/parser, src/generator, src/templates, src/types, src/examples
  - Define this type: `interface FunctionMetadata { name: string; params: { name: string; type: string }[]; returnType: string; }`
  - Write readSourceFile(path) and writeTestFile(path, content) functions
  
Task 1.2: Generate first working test from simple function
  - Create test file: src/examples/math.ts with: `export function add(a: number, b: number): number { return a + b; }`
  - Parse math.ts and extract: `{ name: "add", params: [{ name: "a", type: "number" }, { name: "b", type: "number" }], returnType: "number" }`
  - Use this template string:
    ```
    import { ${metadata.name} } from './math';
    
    describe('${metadata.name}', () => {
      it('should [TEST DESCRIPTION]', () => {
        // Function: ${metadata.name}
        // Params: [TODO: Add values]
        // TODO: Test implementation
      });
    });
    ```
  - Write to src/examples/math.test.ts
  - Verify it compiles: `npm run lint`
  - Verify tests run: `npm test`
  - Success: No TypeScript errors and Jest runs (test can fail, just needs to execute)
  
Task 1.3: Extract reusable patterns into simple interfaces
  - Create Parser interface: `interface Parser { parse(sourceFile: SourceFile): FunctionMetadata[] }`
  - Create Generator interface: `interface Generator { generate(metadata: FunctionMetadata[]): string }`
  - Move hardcoded template into JestGenerator class implementing Generator
  - Move function parsing logic into FunctionParser class implementing Parser
  - Verify same output as Task 1.2 but with cleaner architecture

### Phase 2: Template System and Parameter Analysis
*Build flexible template system and handle different parameter types*

Task 2.1: Create template system with concrete placeholders
  - Define template format with these exact placeholders:
    * `{{functionName}}` - The function being tested
    * `{{paramList}}` - Comma-separated parameters for function call (e.g., "1, 2")
    * `{{testDescription}}` - What this test case is testing
  - Create TestTemplate type: `{ description: string; paramValues: unknown[]; }`
  - Build template renderer that converts TestTemplate → test code string
  - Full template:
    ```
    it('{{testDescription}}', () => {
      // Function: {{functionName}}
      // Params: {{paramList}}
      // TODO: Test implementation
    });
    ```
  - Example output: 
    ```
    it('adds positive numbers', () => {
      // Function: add
      // Params: 1, 2
      // TODO: Test implementation
    });
    ```
  - Note: We provide the key info as comments but don't assume test structure
  - The developer/AI can see what function and inputs this test is meant to cover
  
Task 2.2: Parse and handle different parameter types
  - Enhance FunctionMetadata to include parameter types: 
    ```
    interface ParamMetadata { 
      name: string; 
      type: string; 
      optional: boolean; 
      defaultValue?: string; 
    }
    ```
  - Parse these specific patterns:
    * Required param: `name: string` → `{ name: "name", type: "string", optional: false }`
    * Optional param: `age?: number` → `{ name: "age", type: "number", optional: true }`
    * Default param: `count = 0` → `{ name: "count", type: "number", optional: true, defaultValue: "0" }`
  - For each pattern, immediately generate appropriate test case
  - Store parsed metadata for use in test generation
  
Task 2.3: Generate multiple test cases per parameter type
  - For string params, generate: `["valid string", ""]` (normal, empty)
  - For optional params, generate: `[undefined, "value"]` (omitted, provided)
  - For default params, generate: `[undefined, customValue]` (use default, override default)
  - For number params, generate: `[0, 1, -1]` (zero, positive, negative)
  - For boolean params, generate: `[true, false]`
  - Use `it.each` for parameterized tests:
    ```
    // For 2-param function:
    it.each([
      [1, 2],
      [0, 0],
      [-1, 1],
    ])('test with params (%s, %s)', (...args) => {
      // Function: ${functionName}
      // Params: ${args}
      // TODO: Test implementation
    });
    
    // For n-param function, generate dynamically based on param count
    ```
  - For functions with many params, limit combinations to avoid explosion:
    * 1-2 params: test all combinations
    * 3-4 params: test key combinations (all min, all max, mixed)
    * 5+ params: test boundary cases only
  - Example for 3 params: instead of 2³=8 tests, generate 4 key tests
  - Write all generated tests to single test file

### Phase 3: Control Flow Parsing and Basic Caching
*Parse if/else statements and implement simple change detection*

Task 3.1: Parse if/else statements inside functions
  - Extend parser to find if statements within function bodies
  - Create BranchMetadata type: `{ condition: string; branchId: string; }`
  - For function: `function check(x: number) { if (x > 0) return "positive"; else return "negative"; }`
  - Extract: `[{ condition: "x > 0", branchId: "then" }, { condition: "!(x > 0)", branchId: "else" }]`
  - Generate one test per branch:
    * `it('returns positive when x > 0', () => { // Function: check, Params: 1, TODO: Test implementation });`
    * `it('returns negative when x <= 0', () => { // Function: check, Params: 0, TODO: Test implementation });`
  - Success: Generated tests cover both branches

Task 3.2: Implement file change detection
  - Calculate MD5 hash of source file content
  - Store in cache.json: `{ "src/math.ts": { "hash": "abc123", "lastGenerated": "2024-01-01T10:30:00.000Z" } }`
  - On rerun: Compare current hash vs cached hash
  - If unchanged: Skip regeneration and log "No changes detected"
  - If changed: Regenerate tests and update cache.json
  - Test by running twice - second run should skip generation

Task 3.3: Parse nested and compound conditions
  - Handle nested if: `if (x > 0) { if (y > 0) { ... } }`
  - Generate test combinations: x > 0 AND y > 0, x > 0 AND y <= 0, etc.
  - Handle compound conditions: `if (x > 0 && y < 10)`
  - Extract both parts: `[{ condition: "x > 0", branchId: "cond1" }, { condition: "y < 10", branchId: "cond2" }]`
  - Generate boundary tests: `(1, 9)` for true branch, `(0, 9)` for false branch
  - Maximum 4 test cases for && conditions, 3 for || conditions
  
Task 3.4: Parse ternary operators
  - Find ternary expressions: `const result = x > 0 ? "positive" : "negative"`
  - Extract into same BranchMetadata format as if/else
  - Generate two tests: one for true condition, one for false
  - Example: `const msg = isValid ? "OK" : "Error"`
  - Generate: 
    * `it('returns OK when isValid is true', () => { // Condition: isValid = true, TODO: Test implementation });`
    * `it('returns Error when isValid is false', () => { // Condition: isValid = false, TODO: Test implementation });`
  - For nested ternaries, limit to 4 test cases total

Task 3.5: Parse switch statements
  - Handle various switch patterns:
    * With returns: `case 'A': return 1;`
    * With breaks: `case 'A': result = 1; break;`
    * With blocks: `case 'A': { const x = 1; return x; }`
    * Fall-through: `case 'A': case 'B': return 1;`
  - Create CaseMetadata: `{ value: string; caseId: string; hasFallthrough: boolean; }`
  - For fall-through cases, generate single test: `it('handles A or B cases', () => { // Test both 'A' and 'B' inputs });`
  - For regular cases, one test per case:
    * `it('returns 1 when type is A', () => { // Function: fn, Params: 'A', TODO: Test implementation });`
    * `it('returns 2 when type is B', () => { // Function: fn, Params: 'B', TODO: Test implementation });`
    * `it('returns 0 for default case', () => { // Function: fn, Params: 'unknown', TODO: Test implementation });`

Task 3.6: Parse basic loops (for/while/for-of/for-in)
  - Focus on loop boundary conditions only (not loop body)
  - Classic for: `for (let i = 0; i < arr.length; i++) { sum += arr[i]; }`
  - For-of: `for (const item of items) { sum += item; }`
  - For-in: `for (const key in object) { result[key] = object[key]; }`
  - While: `while (items.length > 0) { process(items.pop()); }`
  - Generate tests for: empty collection, single item, multiple items
  - Example tests:
    * `it('handles empty array', () => { // Function: sumArray, Params: [], TODO: Test implementation });`
    * `it('handles single item', () => { // Function: sumArray, Params: [5], TODO: Test implementation });`
    * `it('handles multiple items', () => { // Function: sumArray, Params: [1,2,3], TODO: Test implementation });`
  - For object iteration (for-in), test: empty object, single property, multiple properties
  - For while loops, test: never enters (false condition), enters once, enters multiple times

Task 3.7: Parse try/catch blocks
  - Find try/catch: `try { return JSON.parse(input); } catch (e) { return null; }`
  - Generate two test paths: success case and error case
  - Success test: `it('parses valid JSON', () => { // Function: parseJSON, Params: '{"a":1}', TODO: Test implementation });`
  - Error test: `it('returns null for invalid JSON', () => { // Function: parseJSON, Params: 'invalid', TODO: Test implementation });`
  - Note in comment that error case may need mocking for some scenarios
  - Only generate error test if error can be triggered via parameters

### Phase 4: Classes, Objects, and Collections
*Parse object-oriented constructs and complex data structures with test generation*

Task 4.1: Parse class methods
  - Find classes: `class Calculator { add(a: number, b: number) { return a + b; } }`
  - Extract ClassMetadata: `{ name: "Calculator", methods: [{ name: "add", params: [{ name: "a", type: "number", optional: false }, { name: "b", type: "number", optional: false }], returnType: "number" }] }`
  - Example with defaults: `class Config { get(key: string, defaultVal: string = '') { ... } }`
  - Extracts to: `{ name: "Config", methods: [{ name: "get", params: [{ name: "key", type: "string", optional: false }, { name: "defaultVal", type: "string", optional: true, defaultValue: "''" }], returnType: "string" }] }`
  - Generate test that instantiates class and calls methods:
    ```
    describe('Calculator', () => {
      it('calls add method with two numbers', () => {
        // Class: Calculator
        // Method: add
        // Params: 1, 2
        // TODO: Test implementation
      });
    });
    ```
  - Skip private methods (those starting with # or marked private)
  - Handle constructor parameters if present

Task 4.2: Parse object factory functions
  - Find functions that return objects: `function createUser(name: string) { return { name, id: Date.now() }; }`
  - Generate tests for object properties:
    ```
    it('creates user with name', () => {
      // Function: createUser
      // Params: 'John'
      // Returns: object with name and id properties
      // TODO: Test implementation
    });
    ```
  - For object methods: `{ getName() { return this.name; } }`
  - Generate: `it('getName returns name', () => { // Method: getName, Setup: createObj('Test'), TODO: Test implementation });`

Task 4.3: Parse array manipulation functions
  - Find functions that work with arrays: `function getFirst(arr: number[]) { return arr[0]; }`
  - Generate boundary tests:
    * Empty array: `it('returns undefined for empty array', () => { // Function: getFirst, Params: [], TODO: Test implementation });`
    * Single item: `it('returns first item', () => { // Function: getFirst, Params: [42], TODO: Test implementation });`
    * Multiple items: `it('returns first of many', () => { // Function: getFirst, Params: [1,2,3], TODO: Test implementation });`
  - For array methods: `function addItem(arr: string[], item: string) { arr.push(item); return arr; }`
  - Test mutation: `it('adds item to array', () => { // Function: addItem, Params: ['a'], 'b', TODO: Test implementation });`

Task 4.4: Parse callback functions
  - Find functions accepting callbacks: `function process(data: string, callback: (result: string) => void) { }`
  - Generate test with mock function comment:
    ```
    it('calls callback with processed data', () => {
      // Function: process
      // Params: 'test', [callback function]
      // TODO: Test implementation (needs mock)
    });
    ```
  - Note that actual mock implementation is left for AI/developer

### Phase 5: React/JSX Support with Plugin System
*Implement React component parsing using established plugin architecture*

Task 5.1: Parse basic React components
  - Create ReactParser implementing Parser interface from Phase 1
  - Parse: `function Button({ label, onClick }: { label: string; onClick: () => void }) { return <button onClick={onClick}>{label}</button>; }`
  - Extract ComponentMetadata: `{ name: "Button", props: [{ name: "label", type: "string" }, { name: "onClick", type: "function" }] }`
  - Generate React Testing Library test:
    ```
    it('renders button with label', () => {
      // Component: Button
      // Props: label="Click me", onClick={function}
      // TODO: Test implementation
    });
    ```
  - For onClick props, add fireEvent test case

Task 5.2: Parse components with useState
  - Find: `function Counter() { const [count, setCount] = useState(0); return <button onClick={() => setCount(count + 1)}>{count}</button>; }`
  - Generate test for initial state and state change:
    ```
    it('increments count on click', () => {
      // Component: Counter
      // Test: Initial state and click interaction
      // TODO: Test implementation
    });
    ```
  - Skip useEffect for MVP - focus on visible state changes

Task 5.3: Parse conditional rendering
  - Find: `{isLoading ? <Spinner /> : <Content data={data} />}`
  - Generate tests for both conditions:
    ```
    it('shows spinner when loading', () => {
      // Component: Component
      // Props: isLoading={true}
      // TODO: Test implementation
    });
    it('shows content when not loading', () => {
      // Component: Component
      // Props: isLoading={false}, data={mockData}
      // TODO: Test implementation
    });
    ```


### Phase 6: Test Generation Strategies
*Support different testing approaches beyond simple input/output validation*

Task 6.1: Define concrete test strategies
  - Strategy 1 - Pure Function: `function add(a, b) { return a + b; }`
    * Test template: `expect(add(1, 2)).toBe(3);`
  - Strategy 2 - Orchestrator: `function processOrder(order) { validate(order); calculate(order); save(order); }`
    * Test template: `validate = jest.fn(); /* test it was called with order */`
  - Strategy 3 - State Mutator: `function addToCart(cart, item) { cart.items.push(item); }`
    * Test template: `const cart = { items: [] }; addToCart(cart, item); /* assert cart.items contains item */`
  
Task 6.2: Auto-detect which strategy to use
  - If function has return statement and no external calls → Pure Function strategy
  - If function calls other functions passed as params → Mock Verification strategy
  - If function modifies parameters → State Change strategy
  - If function has no return but calls methods → Orchestrator strategy
  - Add comment in test: `// Strategy: Pure Function` for clarity
  
Task 6.3: Generate strategy-specific templates
  - Pure: Simple input/output assertions
  - Mock: Include `jest.fn()` setup and `.toHaveBeenCalledWith()` assertions
  - State: Capture before state, call function, assert after state
  - Each strategy has different describe block structure
  - Example: Orchestrator tests group by "should call X" vs Pure tests group by "with Y input"

### Phase 7: CLI Integration and Lint Mode
*Package everything into a usable CLI tool with production-ready features*

**Note**: The CLI commands below show `assayer` as the command name. This will be available after the npm package is built and installed in Phase 9.

Task 7.1: Create basic CLI with file input
  - Create src/cli.ts with shebang: `#!/usr/bin/env node`
  - Parse command line args: command (generate/lint) and file path
  - For generate: Read file → Parse → Generate tests → Write to math.test.ts
  - For lint: Read file → Parse → Check if math.test.ts exists → Report gaps
  - Show progress: "Parsing src/math.ts... Generated 5 test stubs... Written to src/math.test.ts"
  - Handle errors: File not found, syntax errors, write failures
  - Make executable: `chmod +x src/cli.ts`
  
Task 7.2: Add lint mode for coverage reporting
  - Command: `assayer lint src/math.ts` (after npm install)
  - Parse source file and extract all branches/functions
  - Read corresponding test file if exists
  - Report: "src/math.ts: 3 functions found, 2 tested, 1 missing"
  - List missing: "- function calculateTax() has no tests"
  - Exit code: 0 if all covered, 1 if gaps found (for CI/CD)

Task 7.3: Add configuration file support
  - Look for `.assayer.json` in project root
  - Config schema:
    ```
    {
      "ignore": ["**/*.spec.ts", "**/node_modules/**"],
      "testDir": "src/__tests__",
      "framework": "jest",
      "strategy": "auto"
    }
    ```
  - Command line args override config file
  - If no config, use sensible defaults
  - Validate config on load, warn about unknown fields
  
Task 7.4: Handle multiple files and directories
  - Support: `assayer generate src/` (whole directory)
  - Use glob from config or default `**/*.ts` excluding tests
  - Show progress bar: "Processing 15 files... [####----] 8/15"
  - Generate summary: "Generated 47 test stubs across 15 files"
  - Respect ignore patterns from config
  - Handle errors per file, don't stop on first error

### Phase 8: Advanced Caching and Incremental Updates
*Enhance the basic caching system with robust incremental update capabilities*

Task 8.1: Parse existing test files to preserve content
  - Read existing test file and parse with TypeScript AST
  - Find test blocks: `it('test name', () => { /* content */ })`
  - Extract test content between `{` and `}` including assertions
  - Store mapping: `{ "test name": "preserved content" }`
  - When regenerating, check if test name matches and reuse content
  - Mark preserved content: `// Preserved from previous generation`
  
Task 8.2: Implement smart diff detection
  - Instead of file hash, hash individual functions: `md5(functionName + JSON.stringify(params) + body)`
  - Store in cache: `{ "add(a,b)": { "hash": "xyz", "testNames": ["adds two numbers"] } }`
  - On reparse: Only regenerate if function hash changed
  - If function moved but didn't change, update line numbers only
  - Show what changed: "Modified: calculateTax(), Added: calculateDiscount()"
  
Task 8.3: Handle test file conflicts
  - Before overwriting, check for `// Generated by Assayer` header
  - If header missing: "Warning: math.test.ts exists but wasn't generated. Overwrite? [y/N]"
  - Add --force flag to skip confirmation
  - Backup existing file to .test.ts.backup before overwriting
  - If generation fails, restore from backup
  
Task 8.4: Add watch mode for development
  - Command: `assayer watch src/`
  - Use fs.watch or chokidar to monitor file changes
  - On change: Only reprocess changed file
  - Show: "Detected change in math.ts... Regenerated 2 test stubs"
  - Debounce rapid changes (wait 500ms after last change)
  - Cache parsed ASTs in memory during watch session

### Phase 9: NPM Package and Distribution
*Package the tool for distribution and public use*

Task 9.1: Convert to proper npm package structure
  - Update package.json with proper fields:
    ```
    {
      "name": "assayer",
      "version": "0.1.0",
      "description": "Assayer: AST-based test generator that assays your TypeScript code",
      "bin": {
        "assayer": "./dist/cli.js"
      },
      "main": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "files": ["dist", "README.md", "LICENSE"]
    }
    ```
  - Add build script: `"build": "tsc --outDir dist"`
  - Add prepublish script: `"prepublishOnly": "npm run build && npm test"`
  - Create proper entry points: index.ts for programmatic API, cli.ts for CLI
  
Task 9.2: Create programmatic API
  - Export main functions from index.ts:
    ```
    export { generateTestStubs } from './generator';
    export { parseTypeScriptFile } from './parser';
    export { TestGeneratorConfig } from './types';
    ```
  - Allow usage: `import { generateTestStubs } from 'assayer';`
  - Document API with JSDoc comments
  - Add example: `const stubs = await generateTestStubs('src/math.ts', { strategy: 'pure' });`
  
Task 9.3: Package and test locally
  - Run `npm pack` to create tarball
  - Test install in separate project: `npm install ../assayer-0.1.0.tgz`
  - Verify CLI works: `npx assayer generate src/math.ts`
  - Test programmatic API in Node script
  - Add install instructions to README
  - Create .npmignore to exclude test files and source

### Phase 10: Advanced TypeScript Patterns
*Add support for complex TypeScript and JavaScript patterns*

Task 10.1: Handle async/await patterns
  - Parse: `async function fetchUser(id: string): Promise<User> { const user = await api.get(id); return user; }`
  - Generate async test template:
    ```
    it('fetches user by id', async () => {
      // Function: fetchUser
      // Params: '123'
      // TODO: Test implementation (async, needs mock)
    });
    ```
  - For error cases: `it('handles fetch error', async () => { // Async error case, TODO: Test implementation });`
  - Add timeout comment: `// Note: May need jest.setTimeout for slow async operations`

Task 10.2: Parse generic functions
  - Find: `function identity<T>(value: T): T { return value; }`
  - Generate tests with concrete types:
    ```
    it('returns string identity', () => {
      // Function: identity<string>
      // Params: 'test'
      // TODO: Test implementation
    });
    it('returns number identity', () => {
      // Function: identity<number>
      // Params: 42
      // TODO: Test implementation
    });
    ```
  - For constrained generics, test with valid type that meets constraint

## Post-MVP Enhancement: Sandboxed Execution for Assertion Generation

*Execute pure functions and simple components to generate real assertions instead of TODOs*

### Execution-Based Test Enhancement
*After stub generation works reliably, add intelligent assertion generation through sandboxed execution*

Task E1: Pure Function Execution
  - Identify pure functions (no external calls, no side effects)
  - Extract function code and create Node.js vm sandbox
  - Execute with test inputs: `vm.runInContext('add(1, 2)', sandbox)`
  - Capture actual output and generate real assertions
  - Example: `expect(result).toBe(3)` instead of `expect(result).toBe(undefined)`
  - Fall back to TODO stubs if execution fails or times out
  - Add timeout protection (100ms) and memory limits

Task E2: Simple React Component Rendering  
  - Use React Test Renderer for stateless components
  - Render with test props: `render(<Button label="Click" />)`
  - Capture rendered output and generate DOM assertions
  - Example: `expect(screen.getByText('Click')).toBeInTheDocument()`
  - Handle basic useState by simulating interactions
  - Skip components with useEffect, API calls, or context

Task E3: Tiered Assertion Strategy
  - Tier 1: Pure functions → Execute and use real values
  - Tier 2: Simple components → Render and verify output
  - Tier 3: Complex code → Fall back to branch stubs
  - Add metadata comments: `// Assertion generated via execution`
  - Track success rate to improve detection heuristics
  - Allow opt-out via config for security-conscious users

## Post-MVP Extensions: Additional Framework Support

*These can be implemented after core functionality is complete*

### Vue.js Plugin
- Parse Vue SFC (Single File Component) structure
- Extract template, script, and style sections
- Handle Vue directives and composition API
- Target: `<template>`, `<script setup>`, `v-if`, `v-for`

### Angular Plugin  
- Parse Angular component decorators and templates
- Extract component metadata and dependency injection
- Handle Angular directives and services
- Target: `@Component`, `*ngIf`, `*ngFor`, DI patterns

### Svelte Plugin
- Parse Svelte component structure
- Handle reactive statements and stores
- Extract component props and events
- Target: `$:`, `{#if}`, `{#each}`, `bind:`

### Node.js/Express Plugin
- Parse Express route handlers and middleware
- Extract API endpoint patterns
- Handle request/response testing
- Target: `app.get()`, `router.use()`, middleware patterns

## Post-MVP Test Framework Extensions

*Additional test framework support after Jest MVP*

### Vitest Plugin
- Vitest-specific template generation
- Handle Vitest-specific APIs and assertions
- Target: `test()`, `describe()`, `vi.mock()`

### Playwright Plugin  
- Component and E2E test generation
- Browser interaction test stubs
- Target: `test.describe()`, `page.click()`, `expect(page)`

### Mocha/Chai Plugin
- Traditional test framework support
- Handle different assertion libraries
- Target: `describe()`, `it()`, `expect().to.equal()`

## Success Metrics

**Primary**: Generate 100% branch coverage test stubs for any TypeScript/React file
**Secondary**: Reduce AI test completion variance from 467% to <10%
**Tertiary**: Generate runnable test files for a single file in <5 seconds

## Key Features

### **Deterministic Gap Analysis**
- Identifies exactly which code paths lack test coverage
- Provides specific file locations and missing branch conditions
- Outputs actionable reports for CI/CD integration

### **Intelligent Input Synthesis**
- Reverse-engineers the specific input values needed to trigger each code path
- Generates boundary conditions (null, undefined, empty arrays, edge values)
- Creates realistic test data that matches TypeScript type constraints

### **AI-Friendly Output**
- Pre-structured test stubs with descriptive names following DAMP principles
- Arrange/Act/Assert scaffolding that AI can reliably complete
- Type-safe templates that compile without errors

### **Incremental Updates**
- Preserves AI-generated test content when source code changes
- Only regenerates stubs for modified code paths
- Embedded metadata enables intelligent reparsing

## Development Approach

**Major architectural decisions:**
- **Fixed task numbering**: Sequential within each phase
- **Enforced incremental output**: Every parsing task immediately generates test stubs
- **Split oversized phases**: Each phase focuses on 1-2 core concepts maximum
- **Plugin architecture**: Framework and test runner separation proven with single MVP implementations

**Result**: Clean, consistent task structure following incremental output principle throughout.

## AI Task Constraints

Each atomic task requires:
- **Clear Input**: Specific AST node or code pattern
- **Defined Output**: Exact template or code structure
- **Validation Criteria**: Must compile + basic syntax checks
- **Examples**: 2-3 concrete examples

## Success Criteria

Per task validation:
- **Compiles**: TypeScript compilation passes
- **Executable**: Generated tests run without import errors
- **Structured**: Follows defined template patterns
- **Repeatable**: Same input produces same output
- **Cumulative**: New metadata enhances existing test file without breaking previous output
- **Preserves AI Content**: Reparsing maintains AI-generated content while adding new stubs

## Dependency Chain

```
Foundation → Branch Detection → JSX Analysis → Template Generation → Integration
```

**Rule**: No task depends on more than one previous task. If it does, break it down further.

## Task Validation Process

1. **Unit Test**: Each parser function has its own tests
2. **Integration Test**: Output compiles and runs
3. **Regression Test**: Previous tasks still pass
4. **Performance Test**: Execution time under limits
5. **Cumulative Test**: Enhanced test file maintains all previous functionality
6. **Reparse Test**: Metadata allows successful incremental updates

## Risk Mitigation

- **Start Simple**: Begin with trivial examples
- **Incremental Complexity**: Add one feature at a time
- **Fast Feedback**: Validate each task immediately
- **Clear Rollback**: Each task is independently revertible
- **Immediate Validation**: Every task produces working test output
- **Metadata Preservation**: Reparsing system protects AI-generated content
- **Noise Filtering**: Ignore system prevents low-value test generation
- **Streamlined Phases**: Each phase focuses on 1-2 core concepts max
- **Plugin Architecture**: Framework and test runner separation proven with single implementations