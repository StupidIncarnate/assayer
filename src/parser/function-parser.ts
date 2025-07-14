import { Project, SourceFile, FunctionDeclaration, ArrowFunction, FunctionExpression, ScriptTarget, ModuleKind, Node, VariableDeclaration } from 'ts-morph';
import { FunctionMetadata } from '../types/metadata';
import { Parser, ParserConfig } from '../types/parser';

/**
 * Main parser that extracts function metadata from TypeScript source files.
 * Uses configuration to control which types of functions to extract and whether to include
 * only exported functions or all functions in the source code.
 * 
 * Configuration options:
 * - includePrivate: Include non-exported functions (default: true)
 * - includeArrowFunctions: Include arrow functions (default: true)  
 * - includeClassMethods: Include class methods (default: true)
 * 
 * When includePrivate=false, extracts only exported functions.
 * When all options=true (default), extracts all functions including private ones.
 * 
 * @implements {Parser}
 */
export class FunctionParser implements Parser {
  private project: Project;
  private config: Required<ParserConfig>;

  constructor(config: ParserConfig = {}) {
    this.project = new Project({
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.CommonJS,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
    });

    // Set default configuration - matches CreateFunctionParser behavior by default
    this.config = {
      includePrivate: config.includePrivate ?? true,
      includeArrowFunctions: config.includeArrowFunctions ?? true,
      includeClassMethods: config.includeClassMethods ?? true,
      supportedExtensions: config.supportedExtensions ?? ['.ts', '.tsx', '.js', '.jsx'],
    };
  }

  /**
   * Parse a source file and extract function metadata
   * @param sourceFile The ts-morph SourceFile to parse
   * @returns Array of function metadata
   */
  parse(sourceFile: SourceFile): FunctionMetadata[] {
    return this.extractFunctions(sourceFile);
  }

  /**
   * Helper method to create a SourceFile from a file path.
   * This method is provided for convenience when working with file paths.
   * 
   * @param filePath - The absolute or relative path to the source file
   * @returns A ts-morph SourceFile object
   * @throws {Error} If the file cannot be read or parsed
   */
  createSourceFileFromPath(filePath: string): SourceFile {
    try {
      return this.project.addSourceFileAtPath(filePath);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create SourceFile from ${filePath}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Helper method to create a SourceFile from source code string.
   * This method is provided for convenience when working with source code strings.
   * 
   * @param sourceCode - The source code to parse as a string
   * @param fileName - Optional filename for better error messages and context
   * @returns A ts-morph SourceFile object
   */
  createSourceFileFromCode(sourceCode: string, fileName: string = 'temp.ts'): SourceFile {
    return this.project.createSourceFile(fileName, sourceCode, { overwrite: true });
  }

  /**
   * Get the ts-morph Project instance.
   * This can be used to manage SourceFiles, particularly for cleanup after parsing.
   * 
   * @returns The ts-morph Project instance
   */
  getProject(): Project {
    return this.project;
  }

  /**
   * Helper method to parse source code string using the parse method
   * Creates a temporary SourceFile and passes it to parse()
   * @param sourceCode The source code to parse
   * @param fileName Optional filename for the source file
   * @returns Array of function metadata
   */
  parseSourceCode(sourceCode: string, fileName: string = 'temp.ts'): FunctionMetadata[] {
    const sourceFile = this.createSourceFileFromCode(sourceCode, fileName);
    try {
      return this.parse(sourceFile);
    } finally {
      // Clean up
      this.project.removeSourceFile(sourceFile);
    }
  }

  /**
   * Extracts functions from a source file based on configuration.
   * 
   * @param sourceFile - The ts-morph SourceFile to extract functions from
   * @returns An array of FunctionMetadata objects
   */
  private extractFunctions(sourceFile: SourceFile): FunctionMetadata[] {
    const functions: FunctionMetadata[] = [];

    // Extract regular function declarations
    const functionDeclarations = sourceFile.getFunctions();
    for (const func of functionDeclarations) {
      // Apply export filter if includePrivate is false
      if (!this.config.includePrivate && !this.isExported(func)) {
        continue;
      }

      const metadata = this.extractFunctionDeclarationMetadata(func);
      functions.push(metadata);
    }

    // Extract arrow functions, function expressions, and methods if configured
    if (this.config.includeArrowFunctions || this.config.includeClassMethods) {
      sourceFile.forEachDescendant((node) => {
        // Extract arrow functions and function expressions from variable declarations
        if (this.config.includeArrowFunctions && Node.isVariableDeclaration(node)) {
          const initializer = node.getInitializer();
          if (initializer) {
            if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
              // Check if we should include private functions
              if (!this.config.includePrivate && !this.isVariableExported(node)) {
                return; // Skip non-exported variables
              }
              const metadata = this.extractVariableFunctionMetadata(node, initializer);
              functions.push(metadata);
            }
          }
        }
        
        // Extract methods from classes if configured
        if (this.config.includeClassMethods && Node.isMethodDeclaration(node)) {
          const parent = node.getParent();
          // Only process methods if they're in a class, not in an object literal
          if (parent && (Node.isClassDeclaration(parent) || Node.isClassExpression(parent))) {
            const metadata = this.extractMethodMetadata(node);
            functions.push(metadata);
          }
        }
        
        // Extract methods from object literals if arrow functions are enabled
        if (this.config.includeArrowFunctions) {
          if (Node.isPropertyAssignment(node)) {
            const initializer = node.getInitializer();
            if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
              const metadata = this.extractObjectMethodMetadata(node, initializer);
              functions.push(metadata);
            }
          }
          
          // Extract shorthand method declarations in object literals  
          if (Node.isMethodDeclaration(node)) {
            const parent = node.getParent();
            if (parent && Node.isObjectLiteralExpression(parent)) {
              const metadata = this.extractMethodMetadata(node);
              functions.push(metadata);
            }
          }
        }
      });
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
   * Checks if a variable declaration is exported.
   * 
   * @param varDecl - The variable declaration to check
   * @returns True if the variable is exported, false otherwise
   */
  private isVariableExported(varDecl: VariableDeclaration): boolean {
    // Get the variable statement that contains this declaration
    const varStatement = varDecl.getVariableStatement();
    if (!varStatement) {
      return false;
    }
    
    // Check if the variable statement has export keyword
    if (varStatement.hasExportKeyword()) {
      return true;
    }
    
    // Check if it's part of a named export statement
    const exportDeclarations = varDecl.getSourceFile().getExportDeclarations();
    const variableName = varDecl.getName();
    
    for (const exportDecl of exportDeclarations) {
      const namedExports = exportDecl.getNamedExports();
      if (namedExports.some(ne => ne.getName() === variableName)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extracts metadata from a regular function declaration.
   * Consolidated from both parser implementations.
   * 
   * @param func - The function declaration to extract metadata from
   * @returns A FunctionMetadata object
   */
  private extractFunctionDeclarationMetadata(func: FunctionDeclaration): FunctionMetadata {
    const name = func.getName() || 'anonymous';
    const params = this.extractParameters(func.getParameters());
    const returnType = this.extractReturnTypeFromFunction(func);

    return {
      name,
      params,
      returnType,
    };
  }

  /**
   * Extracts metadata from a variable declaration containing a function.
   * From CreateFunctionParser implementation.
   * 
   * @param varDecl - The variable declaration node
   * @param func - The arrow function or function expression
   * @returns A FunctionMetadata object
   */
  private extractVariableFunctionMetadata(
    varDecl: VariableDeclaration,
    func: ArrowFunction | FunctionExpression
  ): FunctionMetadata {
    const name = varDecl.getName();
    const params = this.extractParameters(func.getParameters());
    const returnType = this.extractReturnTypeFromExpression(func);

    return {
      name,
      params,
      returnType,
    };
  }

  /**
   * Extracts metadata from a method declaration.
   * From CreateFunctionParser implementation.
   * 
   * @param method - The method declaration node
   * @returns A FunctionMetadata object
   */
  private extractMethodMetadata(method: any): FunctionMetadata {
    const name = method.getName ? method.getName() : 'anonymous';
    const params = this.extractParameters(method.getParameters());
    const returnType = this.extractReturnTypeFromMethod(method);

    return {
      name,
      params,
      returnType,
    };
  }

  /**
   * Extracts metadata from an object property that is a function.
   * From CreateFunctionParser implementation.
   * 
   * @param prop - The property assignment node
   * @param func - The arrow function or function expression
   * @returns A FunctionMetadata object
   */
  private extractObjectMethodMetadata(
    prop: any,
    func: ArrowFunction | FunctionExpression
  ): FunctionMetadata {
    const name = prop.getName();
    const params = this.extractParameters(func.getParameters());
    const returnType = this.extractReturnTypeFromExpression(func);

    return {
      name,
      params,
      returnType,
    };
  }

  /**
   * Extracts parameter information from a list of parameters.
   * Consolidated and enhanced from both parser implementations.
   * 
   * @param parameters - The parameters to extract information from
   * @returns An array of parameter metadata
   */
  private extractParameters(parameters: any[]): FunctionMetadata['params'] {
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
   * Consolidated and enhanced from both parser implementations.
   * Handles optional parameters, rest parameters, and default values.
   * 
   * @param param - The parameter to get the type of
   * @returns The type as a string
   */
  private getParameterType(param: any): string {
    // Check if parameter is a rest parameter
    const isRestParameter = param.isRestParameter ? param.isRestParameter() : false;
    
    // Check if parameter is optional
    const isOptional = param.isOptional ? param.isOptional() : false;
    
    // Check if parameter has a default value
    const hasInitializer = param.getInitializer ? !!param.getInitializer() : false;
    
    // Try to get the explicit type annotation
    const typeNode = param.getTypeNode ? param.getTypeNode() : null;
    if (typeNode) {
      const typeText = typeNode.getText();
      // Rest parameters are not optional, even though isOptional() might return true
      if (isRestParameter) {
        return typeText;
      }
      // For optional parameters without explicit undefined, add it
      if ((isOptional || hasInitializer) && !typeText.includes('undefined')) {
        return `${typeText} | undefined`;
      }
      return typeText;
    }
    
    // If no explicit type, try to get the inferred type
    if (param.getType) {
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
      
      // Handle optional/default parameters
      if ((isOptional || hasInitializer) && !typeText.includes('undefined')) {
        return `${typeText} | undefined`;
      }
      
      return typeText;
    }
    
    // Default fallback
    return 'any';
  }

  /**
   * Extracts the return type from a function declaration.
   * 
   * @param func - The function declaration to extract the return type from
   * @returns The return type as a string
   */
  private extractReturnTypeFromFunction(func: FunctionDeclaration): string {
    // Try to get the explicit return type annotation
    const returnTypeNode = func.getReturnTypeNode();
    if (returnTypeNode) {
      return returnTypeNode.getText();
    }
    
    // If no explicit return type, try to infer it
    try {
      const signature = func.getSignature();
      if (signature) {
        const returnType = signature.getReturnType();
        const typeText = returnType.getText();
        
        // Clean up complex type representations
        if (typeText.includes('import(')) {
          return 'any'; // Fallback for complex import types
        }
        
        return typeText;
      }
    } catch (_error) {
      // If we can't get the signature (e.g., for JS files without types), default to any
      return 'any';
    }
    
    return 'void';
  }

  /**
   * Extracts the return type from an arrow function or function expression.
   * From CreateFunctionParser implementation.
   * 
   * @param func - The arrow function or function expression
   * @returns The return type as a string
   */
  private extractReturnTypeFromExpression(func: ArrowFunction | FunctionExpression): string {
    // Try to get the explicit return type annotation
    const returnTypeNode = func.getReturnTypeNode();
    if (returnTypeNode) {
      return returnTypeNode.getText();
    }
    
    // If no explicit return type, try to infer it
    try {
      const signature = func.getSignature();
      if (signature) {
        const returnType = signature.getReturnType();
        const typeText = returnType.getText();
        
        // Clean up complex type representations
        if (typeText.includes('import(')) {
          return 'any'; // Fallback for complex import types
        }
        
        return typeText;
      }
    } catch (_error) {
      // If we can't get the signature, fall back to conservative defaults
    }
    
    // For arrow functions, check if it's a simple expression return
    if (Node.isArrowFunction(func) && !func.getBody().getText().startsWith('{')) {
      // Simple expression return, try to infer type
      return 'any'; // Conservative fallback
    }
    
    return 'void';
  }

  /**
   * Extracts the return type from a method declaration.
   * From CreateFunctionParser implementation.
   * 
   * @param method - The method declaration
   * @returns The return type as a string
   */
  private extractReturnTypeFromMethod(method: any): string {
    // Try to get the explicit return type annotation
    if (method.getReturnTypeNode) {
      const returnTypeNode = method.getReturnTypeNode();
      if (returnTypeNode) {
        return returnTypeNode.getText();
      }
    }
    
    // If no explicit return type, try to infer it
    try {
      if (method.getSignature) {
        const signature = method.getSignature();
        if (signature) {
          const returnType = signature.getReturnType();
          const typeText = returnType.getText();
          
          // Clean up complex type representations
          if (typeText.includes('import(')) {
            return 'any'; // Fallback for complex import types
          }
          
          return typeText;
        }
      }
    } catch (_error) {
      // If we can't get the signature, fall back to void
    }
    
    return 'void';
  }
}