/**
 * Metadata structure for representing TypeScript/JavaScript function signatures.
 * Used by Assayer to track and analyze function definitions for test generation.
 */
export interface FunctionMetadata {
  /**
   * The name of the function
   * @example "calculateTotal", "handleClick", "getUserById"
   */
  name: string;
  
  /**
   * Array of parameter definitions for the function
   * Can be empty for functions with no parameters
   */
  params: {
    /**
     * The name of the parameter
     * @example "userId", "options", "event"
     */
    name: string;
    
    /**
     * The TypeScript type of the parameter as a string
     * @example "string", "number", "User", "MouseEvent<HTMLButtonElement>"
     */
    type: string;
  }[];
  
  /**
   * The return type of the function as a TypeScript type string
   * @example "void", "Promise<User>", "string | null"
   */
  returnType: string;
}