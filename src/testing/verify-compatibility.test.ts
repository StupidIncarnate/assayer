/**
 * Tests for VerifyCompatibility
 * 
 * Comprehensive test suite for the VerifyCompatibility component that ensures
 * it correctly validates parser and generator implementations for compatibility
 * with UpdateIntegration.
 */

import { VerifyCompatibility, createCompatibilityVerifier, CompatibilityReport } from './verify-compatibility';
import { Parser } from '../types/parser';
import { Generator } from '../types/generator';
import { FunctionMetadata } from '../types/metadata';

describe('VerifyCompatibility', () => {
  let mockParser: jest.Mocked<Parser>;
  let mockGenerator: jest.Mocked<Generator>;
  let verifier: VerifyCompatibility;

  const mockFunctionMetadata: FunctionMetadata = {
    name: 'testFunction',
    params: [
      { name: 'a', type: 'number' },
      { name: 'b', type: 'number' }
    ],
    returnType: 'number'
  };

  const mockTestContent = `
import { testFunction } from './test';

describe('testFunction', () => {
  it('should work', () => {
    expect(testFunction(1, 2)).toBe(3);
  });
});`;

  beforeEach(() => {
    // Create mock implementations
    mockParser = {
      parse: jest.fn()
    };

    mockGenerator = {
      generateTestFile: jest.fn(),
      generateTestStub: jest.fn(),
      getTestFilePath: jest.fn(),
      validateTestContent: jest.fn()
    };

    // Set up default mock behaviors
    mockParser.parse.mockReturnValue([mockFunctionMetadata]);
    mockGenerator.generateTestFile.mockReturnValue(mockTestContent);
    mockGenerator.getTestFilePath.mockReturnValue('/test/test.test.ts');
    mockGenerator.validateTestContent.mockReturnValue(true);

    // Create verifier instance
    verifier = new VerifyCompatibility(mockParser, mockGenerator, 'MockParser', 'MockGenerator');
  });

  describe('runAllTests', () => {
    it('should run all compatibility tests and return compatible report', async () => {
      const report = await verifier.runAllTests();

      expect(report).toMatchObject({
        compatible: true,
        parserType: 'MockParser',
        generatorType: 'MockGenerator',
        summary: {
          total: 8,
          passed: 8,
          failed: 0
        }
      });

      expect(report.tests).toHaveLength(8);
      expect(report.tests.every(t => t.passed)).toBe(true);
    });

    it('should detect parser incompatibility', async () => {
      // Make parser return invalid data
      mockParser.parse.mockReturnValue(null as any);

      const report = await verifier.runAllTests();

      expect(report.compatible).toBe(false);
      expect(report.summary.failed).toBeGreaterThan(0);
      
      const basicParsingTest = report.tests.find(t => t.testName === 'Basic Parsing');
      expect(basicParsingTest?.passed).toBe(false);
      expect(basicParsingTest?.error).toBe('Parser did not return an array');
    });

    it('should detect generator incompatibility', async () => {
      // Make generator return invalid data
      mockGenerator.generateTestFile.mockReturnValue(null as any);

      const report = await verifier.runAllTests();

      expect(report.compatible).toBe(false);
      expect(report.summary.failed).toBeGreaterThan(0);

      const basicGenerationTest = report.tests.find(t => t.testName === 'Basic Generation');
      expect(basicGenerationTest?.passed).toBe(false);
      expect(basicGenerationTest?.error).toBe('Generator did not return a string');
    });
  });

  describe('individual test methods', () => {
    it('should test basic parsing correctly', async () => {
      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Basic Parsing');

      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
      expect(testResult?.details).toMatchObject({
        functionsFound: 1,
        functionNames: ['testFunction']
      });
    });

    it('should detect empty parser results', async () => {
      mockParser.parse.mockReturnValue([]);

      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Basic Parsing');

      expect(testResult?.passed).toBe(false);
      expect(testResult?.error).toBe('Parser returned empty array for valid code');
    });

    it('should detect invalid function metadata', async () => {
      mockParser.parse.mockReturnValue([{ invalidStructure: true } as any]);

      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Basic Parsing');

      expect(testResult?.passed).toBe(false);
      expect(testResult?.error).toBe('Invalid function metadata structure');
    });

    it('should test basic generation correctly', async () => {
      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Basic Generation');

      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
      expect(testResult?.details?.contentLength).toBeGreaterThan(0);
    });

    it('should detect empty generator output', async () => {
      mockGenerator.generateTestFile.mockReturnValue('');

      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Basic Generation');

      expect(testResult?.passed).toBe(false);
      expect(testResult?.error).toBe('Generator returned empty content');
    });

    it('should test process code integration', async () => {
      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Process Code Integration');

      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
    });

    it('should test error handling', async () => {
      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Process File Error Handling');

      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
      // The error message should indicate graceful handling
      expect(testResult?.details?.errorMessage).toMatch(/handled.*gracefully/);
    });

    it('should test hooks support', async () => {
      // Modify generator to include hook indicator
      mockGenerator.generateTestFile.mockReturnValue('// Hook applied\n' + mockTestContent);

      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Hooks Support');

      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
    });

    it('should test dry run functionality', async () => {
      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Dry Run');

      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
    });

    it('should test batch processing', async () => {
      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Batch Processing');

      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
      expect(testResult?.details?.filesProcessed).toBe(3);
    });

    it('should test edge cases', async () => {
      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Edge Cases');

      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle parser exceptions gracefully', async () => {
      mockParser.parse.mockImplementation(() => {
        throw new Error('Parser crashed');
      });

      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Basic Parsing');

      expect(testResult?.passed).toBe(false);
      expect(testResult?.error).toBe('Parser crashed');
    });

    it('should handle generator exceptions gracefully', async () => {
      mockGenerator.generateTestFile.mockImplementation(() => {
        throw new Error('Generator crashed');
      });

      const report = await verifier.runAllTests();
      const testResult = report.tests.find(t => t.testName === 'Basic Generation');

      expect(testResult?.passed).toBe(false);
      expect(testResult?.error).toBe('Generator crashed');
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate a comprehensive markdown report', async () => {
      const report = await verifier.runAllTests();
      const markdown = VerifyCompatibility.generateMarkdownReport(report);

      expect(markdown).toMatch(/# Compatibility Report/);
      expect(markdown).toMatch(/\*\*Parser:\*\* MockParser/);
      expect(markdown).toMatch(/\*\*Generator:\*\* MockGenerator/);
      expect(markdown).toMatch(/✅ Compatible/);
      expect(markdown).toMatch(/Total Tests: 8/);
      expect(markdown).toMatch(/Passed: 8/);
      expect(markdown).toMatch(/Failed: 0/);
    });

    it('should show failed status in markdown', async () => {
      mockParser.parse.mockReturnValue(null as any);
      
      const report = await verifier.runAllTests();
      const markdown = VerifyCompatibility.generateMarkdownReport(report);

      expect(markdown).toMatch(/❌ Not Compatible/);
      expect(markdown).toMatch(/Failed:/);
      expect(markdown).toMatch(/Error:/);
    });

    it('should include test details in markdown', async () => {
      const report = await verifier.runAllTests();
      const markdown = VerifyCompatibility.generateMarkdownReport(report);

      expect(markdown).toMatch(/### Individual Tests/);
      expect(markdown).toMatch(/Basic Parsing/);
      expect(markdown).toMatch(/Basic Generation/);
      expect(markdown).toMatch(/Process Code Integration/);
      expect(markdown).toMatch(/Hooks Support/);
    });
  });

  describe('createCompatibilityVerifier', () => {
    it('should create a VerifyCompatibility instance', () => {
      const instance = createCompatibilityVerifier(mockParser, mockGenerator);
      
      expect(instance).toBeInstanceOf(VerifyCompatibility);
    });

    it('should use provided type names', () => {
      const report = { 
        parserType: 'CustomParser', 
        generatorType: 'CustomGenerator' 
      } as CompatibilityReport;
      
      const markdown = VerifyCompatibility.generateMarkdownReport({
        ...report,
        compatible: true,
        tests: [],
        summary: { total: 0, passed: 0, failed: 0 }
      });

      expect(markdown).toMatch(/CustomParser/);
      expect(markdown).toMatch(/CustomGenerator/);
    });
  });

  describe('compatibility with real implementations', () => {
    it('should verify compatibility between multiple parsers', async () => {
      // Create a second mock parser with different behavior
      const alternativeParser: jest.Mocked<Parser> = {
        parse: jest.fn().mockReturnValue([
          { name: 'func1', params: [], returnType: 'void' },
          { name: 'func2', params: [], returnType: 'void' }
        ])
      };

      const verifier2 = new VerifyCompatibility(
        alternativeParser,
        mockGenerator,
        'AlternativeParser',
        'MockGenerator'
      );

      const report2 = await verifier2.runAllTests();

      expect(report2.compatible).toBe(true);
      expect(report2.parserType).toBe('AlternativeParser');
    });

    it('should verify compatibility between multiple generators', async () => {
      // Create a second mock generator with different behavior
      const alternativeGenerator: jest.Mocked<Generator> = {
        generateTestFile: jest.fn().mockReturnValue('// Alternative test content'),
        generateTestStub: jest.fn().mockReturnValue('// Stub'),
        getTestFilePath: jest.fn().mockReturnValue('/alt/test.spec.ts'),
        validateTestContent: jest.fn().mockReturnValue(true)
      };

      const verifier2 = new VerifyCompatibility(
        mockParser,
        alternativeGenerator,
        'MockParser',
        'AlternativeGenerator'
      );

      const report2 = await verifier2.runAllTests();

      expect(report2.compatible).toBe(true);
      expect(report2.generatorType).toBe('AlternativeGenerator');
    });
  });
});