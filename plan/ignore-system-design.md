# Ignore System Design

## Problem Statement

Without an ignore system, the parser generates noise tests for:
- Simple className conditionals
- Obvious prop passing
- Basic state setters
- Logging statements
- Debug code
- Third-party library calls
- Environment checks

## Implementation Strategy

### Multi-Layer Filtering Approach

#### Layer 1: Comment-Based Ignoring
```typescript
function calculateTotal(items: Item[]): number {
  // @test-ignore: simple validation
  if (!items) return 0;
  
  // @test-ignore-start
  const debug = process.env.NODE_ENV === 'development';
  if (debug) console.log('Calculating total for', items.length, 'items');
  // @test-ignore-end
  
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

#### Layer 2: Configuration-Based Patterns
```typescript
// .testgen.config.js
module.exports = {
  ignore: {
    // Simple string patterns
    patterns: [
      'console.log',
      'console.error',
      'console.warn',
      'process.env.NODE_ENV',
      'className={.*}',
      'style={.*}'
    ],
    
    // Function call patterns
    functions: [
      'console.*',
      'logger.*',
      'debug.*',
      'performance.mark',
      'performance.measure'
    ],
    
    // Conditional patterns
    conditionals: [
      'isDev',
      'isProduction',
      'process.env.*',
      '__DEV__',
      'NODE_ENV'
    ],
    
    // JSX patterns
    jsx: [
      'className={.*}',
      'style={.*}',
      'data-testid={.*}'
    ]
  }
};
```

#### Layer 3: AST-Level Complexity Filtering
```typescript
interface IgnoreRule {
  type: 'pattern' | 'function' | 'conditional' | 'complexity' | 'jsx';
  rule: string;
  reason: string;
  enabled: boolean;
}

function shouldIgnoreNode(node: ts.Node, rules: IgnoreRule[]): boolean {
  // Filter based on:
  // 1. Complexity score (simple assignments, obvious conditionals)
  // 2. Common patterns (logging, debugging)
  // 3. Framework noise (React boilerplate)
  // 4. User-defined rules
}
```

## Complexity-Based Filtering

### Low-Value Test Patterns
```typescript
// Simple assignments - IGNORE
const className = isActive ? 'active' : 'inactive';

// Obvious prop passing - IGNORE
<Button disabled={isLoading} />

// Basic state setters - IGNORE
const [count, setCount] = useState(0);
const increment = () => setCount(count + 1);

// Environment checks - IGNORE
if (process.env.NODE_ENV === 'development') {
  // debug code
}
```

### High-Value Test Patterns - KEEP
```typescript
// Complex business logic
const total = items.reduce((sum, item) => {
  if (item.discount > 0) {
    return sum + (item.price * (1 - item.discount));
  }
  return sum + item.price;
}, 0);

// Error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    throw new UserError('Invalid input');
  }
  throw error;
}
```

## Implementation Details

### AST Node Analysis
```typescript
function calculateComplexityScore(node: ts.Node): number {
  let score = 0;
  
  // Add points for:
  // - Multiple conditions
  // - Nested logic
  // - Error handling
  // - Business logic keywords
  
  // Subtract points for:
  // - Simple assignments
  // - Logging calls
  // - Framework boilerplate
  
  return score;
}

function isHighValueTest(node: ts.Node): boolean {
  const complexity = calculateComplexityScore(node);
  const isFrameworkNoise = checkFrameworkPatterns(node);
  const isUserIgnored = checkUserIgnoreRules(node);
  
  return complexity > COMPLEXITY_THRESHOLD && 
         !isFrameworkNoise && 
         !isUserIgnored;
}
```

### Configuration Hierarchy
```typescript
// Priority order (highest to lowest):
1. @test-ignore comments in source code
2. User-defined config file patterns
3. Built-in complexity filtering
4. Framework-specific defaults
```

## Built-in Ignore Patterns

### React/JSX Defaults
```typescript
const REACT_IGNORE_PATTERNS = [
  // Styling
  'className={.*}',
  'style={.*}',
  
  // Testing attributes
  'data-testid={.*}',
  'data-cy={.*}',
  
  // Simple prop passing
  'disabled={isLoading}',
  'loading={isLoading}',
  
  // Event handlers with simple callbacks
  'onClick={() => set.*}',
  'onChange={(e) => set.*}'
];
```

### Node.js/General Defaults
```typescript
const GENERAL_IGNORE_PATTERNS = [
  // Logging
  'console.*',
  'logger.*',
  'debug.*',
  
  // Environment
  'process.env.*',
  '__DEV__',
  'NODE_ENV',
  
  // Performance
  'performance.mark',
  'performance.measure'
];
```

## User Experience

### CLI Integration
```bash
# Generate with default ignore rules
testgen src/components/Button.tsx

# Generate with custom ignore patterns
testgen src/components/Button.tsx --ignore-pattern="console.*,logger.*"

# Generate with all patterns (no filtering)
testgen src/components/Button.tsx --no-ignore

# Show what would be ignored
testgen src/components/Button.tsx --dry-run --show-ignored
```

### Configuration File
```javascript
// .testgen.config.js
module.exports = {
  ignore: {
    // Extend built-in patterns
    extends: ['react', 'node'],
    
    // Add custom patterns
    patterns: [
      'myCustomLogger.*',
      'analytics.track'
    ],
    
    // Override built-in patterns
    overrides: {
      'console.log': false // Don't ignore console.log
    }
  }
};
```

## Implementation in Task 5.5

### Sub-tasks:
1. **Comment Parser**: Extract @test-ignore annotations
2. **Config System**: Load and merge ignore rules
3. **Pattern Matcher**: Apply regex patterns to AST nodes
4. **Complexity Analyzer**: Calculate node complexity scores
5. **Integration**: Hook into existing AST traversal

### Validation:
- Noise reduction: Measure test count before/after filtering
- Accuracy: Manual review of ignored vs kept patterns
- Performance: Ensure filtering doesn't slow parsing significantly
- Usability: Test CLI and config file integration

## Success Metrics

- **Noise Reduction**: 70%+ reduction in low-value test cases
- **Accuracy**: <5% false positives (valuable tests ignored)
- **Performance**: <10% overhead from filtering logic
- **Usability**: Zero-config works well for common frameworks
- **Flexibility**: Power users can customize all patterns