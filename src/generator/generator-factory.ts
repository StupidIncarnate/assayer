/**
 * Factory for creating test generators based on framework type
 * Provides a centralized way to instantiate generators that implement Generator
 */

import { Generator, GeneratorConfig } from '../types/generator';
import { JestTestStubGenerator } from './jest-test-stub-generator';

/**
 * Supported testing frameworks
 */
export type SupportedFramework = 'jest' | 'vitest' | 'mocha';

/**
 * Factory class for creating test generators
 */
export class GeneratorFactory {
  private static generators: Map<SupportedFramework, new(config?: GeneratorConfig) => Generator> = new Map([
    ['jest', JestTestStubGenerator],
    // Future generators can be added here:
    // ['vitest', VitestTestStubGenerator],
    // ['mocha', MochaTestStubGenerator],
  ]);

  /**
   * Creates a generator instance for the specified framework
   * @param framework - The testing framework to generate tests for
   * @param config - Optional configuration for the generator
   * @returns An instance of Generator for the specified framework
   * @throws Error if the framework is not supported
   */
  static create(framework: SupportedFramework = 'jest', config?: GeneratorConfig): Generator {
    const GeneratorClass = this.generators.get(framework);
    
    if (!GeneratorClass) {
      throw new Error(
        `Unsupported framework: ${framework}. ` +
        `Supported frameworks: ${Array.from(this.generators.keys()).join(', ')}`
      );
    }

    return new GeneratorClass(config);
  }

  /**
   * Registers a new generator for a framework
   * @param framework - The framework identifier
   * @param generatorClass - The generator class constructor
   */
  static register(framework: SupportedFramework, generatorClass: new(config?: GeneratorConfig) => Generator): void {
    this.generators.set(framework, generatorClass);
  }

  /**
   * Gets the list of supported frameworks
   * @returns Array of supported framework names
   */
  static getSupportedFrameworks(): SupportedFramework[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Checks if a framework is supported
   * @param framework - The framework to check
   * @returns True if the framework is supported
   */
  static isSupported(framework: string): framework is SupportedFramework {
    return this.generators.has(framework as SupportedFramework);
  }
}

/**
 * Convenience function to create a generator
 * @param framework - The testing framework (defaults to 'jest')
 * @param config - Optional configuration for the generator
 * @returns A Generator instance
 */
export function createGenerator(framework: SupportedFramework = 'jest', config?: GeneratorConfig): Generator {
  return GeneratorFactory.create(framework, config);
}

/**
 * Creates a generator with options pre-configured
 * @param framework - The testing framework
 * @param defaultConfig - Default configuration to apply to the generator
 * @returns A configured Generator instance
 */
export function createGeneratorWithDefaults(
  framework: SupportedFramework,
  defaultConfig: GeneratorConfig
): Generator {
  return GeneratorFactory.create(framework, defaultConfig);
}