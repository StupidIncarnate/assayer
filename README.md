# Assayer

A comprehensive TypeScript test stub generator that uses the TypeScript Compiler API to parse source files and generate executable test stubs with comprehensive branch coverage.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Architecture](#core-architecture)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Examples](#examples)
- [Development](#development)
- [Testing](#testing)

## Overview

Assayer is a deterministic testing tool that addresses the unreliability of AI-based code analysis. It uses the TypeScript Compiler API to parse source files, identify all testable code paths and branches, then generates executable test stubs. The key insight is moving intelligence from AI (unreliable) to AST parsing (deterministic), using AI only for filling pre-structured test stubs.

### Key Features

- **Deterministic Parsing**: Uses TypeScript Compiler API for reliable AST analysis
- **Comprehensive Coverage**: Identifies all function types including arrow functions, class methods, and object methods
- **Flexible Generation**: Supports Jest, Vitest, and custom test frameworks
- **Configurable Extraction**: Control which functions to extract (exported-only vs all functions)
- **Template System**: Customizable test templates for different testing patterns
- **Validation Framework**: Built-in validation to ensure generated tests are syntactically correct

## Installation

```bash
npm install assayer
```

## Quick Start

## Core Architecture

Assayer's architecture is built around three main components:

### 1. Parsers

Extract function metadata from TypeScript/JavaScript source code.

- **FunctionParser**: The main parser supporting configurable function extraction
- **SimpleFunctionParser**: Legacy parser for exported functions only

### 2. Generators

Convert function metadata into executable test stubs.

- **JestTestStubGenerator**: Generates Jest-compatible test files
- **GeneratorFactory**: Factory for creating generators with custom configurations

### 3. Templates

Customizable templates for different test patterns and frameworks.

- **JestTemplates**: Template system for Jest test generation
- **Custom Templates**: Support for Vitest, Mocha, and custom frameworks
