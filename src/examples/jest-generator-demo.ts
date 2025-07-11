/**
 * Demonstration of JestTestStubGenerator usage
 * 
 * This example shows how to use the JestTestStubGenerator to create
 * test stubs from function metadata.
 */

import { JestTestStubGenerator } from '../generator/jest-test-stub-generator';
import { FunctionMetadata } from '../types/metadata';

// Example function metadata
const calculateTotalMetadata: FunctionMetadata = {
  name: 'calculateTotal',
  params: [
    { name: 'items', type: 'Item[]' },
    { name: 'taxRate', type: 'number' }
  ],
  returnType: 'number'
};

const fetchUserMetadata: FunctionMetadata = {
  name: 'fetchUser',
  params: [
    { name: 'userId', type: 'string' }
  ],
  returnType: 'Promise<User>'
};

const validateEmailMetadata: FunctionMetadata = {
  name: 'validateEmail',
  params: [
    { name: 'email', type: 'string' }
  ],
  returnType: 'boolean'
};

// Create generator instance
const generator = new JestTestStubGenerator();

// Generate individual test stub
console.log('=== Individual Test Stub ===');
const singleTestStub = generator.generateTestStub(calculateTotalMetadata, 'src/utils/calculator.ts');
console.log(singleTestStub);
console.log('\n');

// Generate complete test file with multiple functions
console.log('=== Complete Test File ===');
const functionsMetadata = [calculateTotalMetadata, fetchUserMetadata, validateEmailMetadata];
const testFile = generator.generateTestFile(functionsMetadata, 'src/services/user-service.ts');
console.log(testFile);

// Example output for demonstration purposes
export const exampleOutput = `
The JestTestStubGenerator creates comprehensive test stubs that include:

1. Basic functionality tests
2. Edge case tests (empty strings, zero values, empty arrays)
3. Error handling tests (missing parameters)
4. Type-specific tests (async operations, array returns)
5. Proper test structure with Arrange-Act-Assert pattern

All tests follow DAMP principles (Descriptive And Meaningful Phrases) and
include TODO comments where specific assertions need to be customized.
`;