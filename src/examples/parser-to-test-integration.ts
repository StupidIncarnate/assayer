/**
 * Integration example: Using SimpleFunctionParser with JestTestStubGenerator
 * 
 * This demonstrates the complete workflow from parsing TypeScript files
 * to generating comprehensive Jest test stubs.
 */

import { SimpleFunctionParser } from '../parser/simple-function-parser';
import { JestTestStubGenerator } from '../generator/jest-test-stub-generator';
import { writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';

/**
 * Generates test files for TypeScript source files
 * @param sourcePath - Path to the TypeScript source file
 * @param outputPath - Optional path for the test file (defaults to [name].test.ts)
 */
export function generateTestsForFile(sourcePath: string, outputPath?: string): void {
  // Initialize parser and generator
  const parser = new SimpleFunctionParser();
  const generator = new JestTestStubGenerator();
  
  try {
    // Parse the source file to extract function metadata
    console.log(`Parsing ${sourcePath}...`);
    const functions = parser.parse(sourcePath);
    
    if (functions.length === 0) {
      console.log('No exported functions found in the file.');
      return;
    }
    
    console.log(`Found ${functions.length} exported functions:`);
    functions.forEach(fn => {
      console.log(`  - ${fn.name}(${fn.params.map(p => `${p.name}: ${p.type}`).join(', ')}): ${fn.returnType}`);
    });
    
    // Generate test file content
    const testContent = generator.generateTestFile(functions, sourcePath);
    
    // Determine output path
    const testPath = outputPath || getDefaultTestPath(sourcePath);
    
    // Write the test file
    writeFileSync(testPath, testContent, 'utf-8');
    console.log(`\nTest file generated: ${testPath}`);
    
  } catch (error) {
    console.error('Error generating tests:', error);
    throw error;
  }
}

/**
 * Gets the default test file path for a source file
 * @param sourcePath - The source file path
 * @returns The test file path
 */
function getDefaultTestPath(sourcePath: string): string {
  const dir = dirname(sourcePath);
  const filename = basename(sourcePath, '.ts');
  return join(dir, `${filename}.test.ts`);
}

// Example usage
if (require.main === module) {
  console.log('=== Parser to Test Generator Integration Demo ===\n');
  
  // Generate tests for the sample functions
  const samplePath = join(__dirname, 'sample-functions.ts');
  const testPath = join(__dirname, 'sample-functions.test.ts');
  
  try {
    generateTestsForFile(samplePath, testPath);
    
    console.log('\n=== Generated Test File Preview ===');
    const { readFileSync } = require('fs');
    const testContent = readFileSync(testPath, 'utf-8');
    console.log(testContent.substring(0, 1000) + '...\n'); // Show first 1000 chars
    
    // Clean up the generated test file for demo purposes
    const { unlinkSync } = require('fs');
    unlinkSync(testPath);
    console.log('(Demo test file cleaned up)');
    
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

export { SimpleFunctionParser, JestTestStubGenerator };