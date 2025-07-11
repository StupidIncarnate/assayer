import { Project, SourceFile, FunctionDeclaration, ScriptTarget, ModuleKind } from 'ts-morph';
import { FunctionMetadata } from '../types/metadata';

/**
 * Simple parser that extracts function metadata from TypeScript source files.
 * Uses ts-morph to parse the TypeScript AST and extract function signatures.
 */
export class SimpleFunctionParser {
  private project: Project;

  constructor() {
    this.project = new Project({
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.CommonJS,
        strict: true,
      },
    });
  }

  /**
   * Parses a TypeScript source file and extracts metadata for all exported functions.
   * 
   * @param filePath - The path to the TypeScript file to parse
   * @returns An array of FunctionMetadata objects representing the functions found
   * @throws {Error} If the file cannot be parsed or doesn't exist
   */
  parse(filePath: string): FunctionMetadata[] {
    try {
      // Add the source file to the project
      const sourceFile = this.project.addSourceFileAtPath(filePath);
      
      // Check for syntax errors
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      if (diagnostics.length > 0) {
        const errorMessages = diagnostics.map(d => d.getMessageText()).join('; ');
        throw new Error(`Syntax errors in file: ${errorMessages}`);
      }
      
      // Extract function metadata
      const functions = this.extractFunctions(sourceFile);
      
      // Clean up - remove the source file from the project
      this.project.removeSourceFile(sourceFile);
      
      return functions;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse file ${filePath}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parses TypeScript source code string and extracts function metadata.
   * Useful for testing or when working with code not yet saved to disk.
   * 
   * @param sourceCode - The TypeScript source code to parse
   * @param fileName - Optional filename for better error messages
   * @returns An array of FunctionMetadata objects
   */
  parseSourceCode(sourceCode: string, fileName: string = 'temp.ts'): FunctionMetadata[] {
    const sourceFile = this.project.createSourceFile(fileName, sourceCode, { overwrite: true });
    
    try {
      return this.extractFunctions(sourceFile);
    } finally {
      // Clean up
      this.project.removeSourceFile(sourceFile);
    }
  }

  /**
   * Extracts function metadata from a source file.
   * Only processes exported function declarations.
   * 
   * @param sourceFile - The ts-morph SourceFile to extract functions from
   * @returns An array of FunctionMetadata objects
   */
  private extractFunctions(sourceFile: SourceFile): FunctionMetadata[] {
    const functions: FunctionMetadata[] = [];

    // Get all function declarations that are exported
    const functionDeclarations = sourceFile.getFunctions();
    
    for (const func of functionDeclarations) {
      // Check if the function is exported
      if (!this.isExported(func)) {
        continue;
      }

      const metadata = this.extractFunctionMetadata(func);
      functions.push(metadata);
    }

    return functions;
  }

  /**
   * Checks if a function declaration is exported.
   * 
   * @param func - The function declaration to check
   * @returns True if the function is exported, false otherwise
   */
  private isExported(func: FunctionDeclaration): boolean {
    // Check for export keyword
    const hasExportKeyword = func.hasExportKeyword();
    
    // Check if it's a default export
    const isDefaultExport = func.hasDefaultKeyword();
    
    // Check if it's part of a named export statement
    const exportDeclarations = func.getSourceFile().getExportDeclarations();
    const functionName = func.getName();
    
    if (functionName) {
      for (const exportDecl of exportDeclarations) {
        const namedExports = exportDecl.getNamedExports();
        if (namedExports.some(ne => ne.getName() === functionName)) {
          return true;
        }
      }
    }
    
    return hasExportKeyword || isDefaultExport;
  }

  /**
   * Extracts metadata from a single function declaration.
   * 
   * @param func - The function declaration to extract metadata from
   * @returns A FunctionMetadata object
   */
  private extractFunctionMetadata(func: FunctionDeclaration): FunctionMetadata {
    const name = func.getName() || 'anonymous';
    const params = this.extractParameters(func);
    const returnType = this.extractReturnType(func);

    return {
      name,
      params,
      returnType,
    };
  }

  /**
   * Extracts parameter information from a function declaration.
   * 
   * @param func - The function declaration to extract parameters from
   * @returns An array of parameter metadata
   */
  private extractParameters(func: FunctionDeclaration): FunctionMetadata['params'] {
    const parameters = func.getParameters();
    
    return parameters.map(param => {
      const name = param.getName();
      const type = this.getParameterType(param);
      
      return {
        name,
        type,
      };
    });
  }

  /**
   * Gets the type of a parameter as a string.
   * 
   * @param param - The parameter to get the type of
   * @returns The type as a string
   */
  private getParameterType(param: any): string {
    // Check if parameter is a rest parameter
    const isRestParameter = param.isRestParameter();
    
    // Check if parameter is optional
    const isOptional = param.isOptional();
    
    // Try to get the explicit type annotation
    const typeNode = param.getTypeNode();
    if (typeNode) {
      const typeText = typeNode.getText();
      // Rest parameters are not optional, even though isOptional() might return true
      if (isRestParameter) {
        return typeText;
      }
      // For optional parameters, append | undefined
      return isOptional && !typeText.includes('undefined') ? `${typeText} | undefined` : typeText;
    }
    
    // If no explicit type, try to get the inferred type
    const type = param.getType();
    const typeText = type.getText();
    
    // Clean up complex type representations
    if (typeText.includes('import(')) {
      return 'any'; // Fallback for complex import types
    }
    
    // Rest parameters are not optional
    if (isRestParameter) {
      return typeText.replace(' | undefined', '');
    }
    
    // For optional parameters with inferred types
    if (isOptional && !typeText.includes('undefined')) {
      return `${typeText} | undefined`;
    }
    
    return typeText;
  }

  /**
   * Extracts the return type from a function declaration.
   * 
   * @param func - The function declaration to extract the return type from
   * @returns The return type as a string
   */
  private extractReturnType(func: FunctionDeclaration): string {
    // Try to get the explicit return type annotation
    const returnTypeNode = func.getReturnTypeNode();
    if (returnTypeNode) {
      return returnTypeNode.getText();
    }
    
    // If no explicit return type, try to infer it
    const signature = func.getSignature();
    if (signature) {
      const returnType = signature.getReturnType();
      const typeText = returnType.getText();
      
      // Clean up complex type representations
      if (typeText.includes('import(')) {
        return 'void'; // Fallback for complex import types
      }
      
      return typeText;
    }
    
    return 'void';
  }
}