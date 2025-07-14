/**
 * Assayer - Comprehensive TypeScript Test Stub Generator
 * 
 * This is the main entry point for all Assayer functionality.
 * All public APIs are exported from this file to provide a single,
 * clear interface for consumers.
 */

// =============================================================================
// Core Types and Interfaces
// =============================================================================
export type { FunctionMetadata } from './types/metadata';
export type { Parser, ParserConfig } from './types/parser';
export type { Generator, GeneratorConfig } from './types/generator';

// =============================================================================
// Parser Components
// =============================================================================
export { FunctionParser } from './parser/function-parser';

// =============================================================================
// Generator Components
// =============================================================================
export { JestTestStubGenerator } from './generator/jest-test-stub-generator';
export { 
  GeneratorFactory, 
  createGenerator, 
  createGeneratorWithDefaults
} from './generator/generator-factory';
export type { SupportedFramework } from './generator/generator-factory';

// =============================================================================
// Template System
// =============================================================================
export { 
  JestTemplates, 
  defaultJestTemplates
} from './templates/jest-templates';
export type { JestTemplateConfig } from './templates/jest-templates';


// =============================================================================
// Testing and Validation Components
// =============================================================================
export {
  VerifyCompatibility,
  createCompatibilityVerifier
} from './testing/verify-compatibility';
export type {
  CompatibilityReport,
  CompatibilityTestResult
} from './testing/verify-compatibility';

export {
  GeneratedTestValidator,
  validateTest,
  validateEndToEnd
} from './validation/generated-test-validator';
export type {
  ValidationResult,
  ValidationOptions,
  EndToEndValidationResult,
  CoverageInfo
} from './validation/generated-test-validator';

// =============================================================================
// Utility Functions
// =============================================================================
export { readSourceFile, writeTestFile } from './utils/file-operations';

// =============================================================================
// Legacy Compatibility and High-Level Workflow
// =============================================================================
export { FunctionToTestIntegration } from './function-to-test-integration';
export type { IntegrationResult } from './function-to-test-integration';
