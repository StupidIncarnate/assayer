/**
 * Parser interface for extracting metadata from TypeScript/JavaScript source files.
 * Defines the contract that all parsers must implement for consistent behavior.
 */

import { SourceFile } from 'ts-morph';
import { FunctionMetadata } from './metadata';

/**
 * Standard parser interface for Assayer.
 * All parsers must implement this method to ensure consistent parsing behavior.
 */
export interface Parser {
  /**
   * Parse a source file and extract function metadata
   * @param sourceFile The ts-morph SourceFile to parse
   * @returns Array of function metadata
   */
  parse(sourceFile: SourceFile): FunctionMetadata[];
}

/**
 * Parser configuration options
 */
export interface ParserConfig {
  /** Whether to include private functions */
  includePrivate?: boolean;
  /** Whether to include arrow functions */
  includeArrowFunctions?: boolean;
  /** Whether to include class methods */
  includeClassMethods?: boolean;
  /** File extensions to support */
  supportedExtensions?: string[];
}