# AST-Based Test Stub Generator

## Problem Statement

Current testing approaches are fundamentally broken:

- **AI-based code analysis is unreliable**: Testing showed 467% variance in violation detection between identical AI agents
- **Coverage tools measure execution, not effectiveness**: Istanbul/Jest tell you what lines ran, not whether they were properly tested
- **Gap analysis is subjective and inconsistent**: AI can't reliably identify what needs testing

## Core Insight

Move the intelligence from AI (unreliable) to deterministic AST parsing (reliable), then use AI only for the constrained problem of filling in pre-structured test stubs.

## Technical Approach

### What We're Building

A Node.js tool that:
1. Parses TypeScript/JSX files using the TypeScript Compiler API
2. Identifies all logical branches, conditionals, and testable code paths
3. Generates executable test stubs with DAMP structure
4. Outputs type-safe Jest/Vitest test files

### Target Coverage

**100% Branch Coverage Required:**
- All if/else branches
- All switch cases  
- All input combinations
- Ternary operators
- Optional chaining (?.)
- Try/catch blocks
- Dynamic values in JSX
- Conditional rendering in JSX
- Event handling (onClick, onChange, form submissions)

## Why This Works

**Deterministic Analysis**: AST parsing finds the same branches every time. No variance, no hallucination, no missed sections.

**Constrained AI Problem**: Instead of "AI, figure out what to test" we ask "AI, fill in these pre-identified test structures" - dramatically simpler task.

**Measurable Output**: Generated stubs are either syntactically correct or they're not. Binary success criteria.

## Architecture

```
Source Code → AST Parser → Branch Detector → Stub Generator → Test Files
```

### Core Components

1. **AST Traversal Engine** - TypeScript Compiler API integration
2. **Branch Detection Logic** - Identifies all testable code paths
3. **Stub Template System** - Generates DAMP test structures
4. **File Generation Pipeline** - Outputs executable test files

## Success Metrics

- **Primary**: Generate 100% branch coverage test stubs for any TypeScript file
- **Secondary**: Reduce AI test completion variance from 467% to <10%
- **Tertiary**: Generate runnable test files in <30 seconds per component

## Timeline

**9 weeks total:**
- Phase 1: Core AST Parser (2 weeks)
- Phase 2: Branch Coverage Analysis (2 weeks)
- Phase 3: React/JSX Support (2 weeks)
- Phase 4: Stub Generation (2 weeks)
- Phase 5: Integration & Polish (1 week)

## Known Limitations

**Won't Handle:**
- Runtime-only conditionals
- External API behavior
- Browser-specific features
- Complex integration scenarios

**Will Generate Noise For:**
- Simple className conditionals
- Obvious prop passing
- Basic state setters

## Risk Assessment

**Medium Risk** - Well-defined problem with established APIs, but complexity lies in semantic analysis of React components and meaningful stub generation.

**Key Dependency**: TypeScript Compiler API stability

## Validation Strategy

Test against existing codebase components, measure AI completion success rate, verify branch coverage completeness, benchmark generation speed.

The goal is not perfect test generation - it's deterministic identification of what needs testing, with AI handling the simpler task of filling in the blanks.