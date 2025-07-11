import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads the contents of a source file and returns it as a string.
 * 
 * @param filePath - The path to the file to read (absolute or relative)
 * @returns The contents of the file as a string
 * @throws {Error} If the file cannot be read (doesn't exist, no permissions, etc.)
 */
export function readSourceFile(filePath: string): string {
  try {
    // Validate the path doesn't contain null bytes
    if (filePath.includes('\0')) {
      throw new Error('Path contains null bytes');
    }

    // Read the file synchronously with UTF-8 encoding
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    // Re-throw with more descriptive error messages
    if (error instanceof Error) {
      if ('code' in error) {
        const errorCode = (error as NodeJS.ErrnoException).code;
        const errorPath = (error as NodeJS.ErrnoException).path;
        
        switch (errorCode) {
          case 'ENOENT':
            throw new Error(`File not found: ${errorPath || filePath}`);
          case 'EACCES':
            throw new Error(`Permission denied: Cannot read file ${errorPath || filePath}`);
          case 'EISDIR':
            throw new Error(`Path is a directory, not a file: ${errorPath || filePath}`);
          case 'EMFILE':
            throw new Error('Too many open files in system');
          case 'ENAMETOOLONG':
            throw new Error(`File path too long: ${errorPath || filePath}`);
          default:
            throw new Error(`Failed to read file: ${error.message}`);
        }
      }
    }
    throw error;
  }
}

/**
 * Writes content to a test file, creating parent directories if necessary.
 * If the file already exists, it will be overwritten.
 * 
 * @param filePath - The path where the file should be written (absolute or relative)
 * @param content - The content to write to the file
 * @throws {Error} If the file cannot be written (no permissions, disk full, etc.)
 */
export function writeTestFile(filePath: string, content: string): void {
  try {
    // Validate the path doesn't contain null bytes
    if (filePath.includes('\0')) {
      throw new Error('Path contains null bytes');
    }

    // Ensure the parent directory exists
    const directory = path.dirname(filePath);
    
    // Create directory recursively if it doesn't exist
    try {
      fs.mkdirSync(directory, { recursive: true });
    } catch (mkdirError) {
      if (mkdirError instanceof Error && 'code' in mkdirError) {
        const errorCode = (mkdirError as NodeJS.ErrnoException).code;
        if (errorCode !== 'EEXIST') {
          // Only throw if it's not "already exists" error
          throw mkdirError;
        }
      }
    }

    // Check if the path points to an existing directory
    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        throw new Error(`Path is a directory, not a file: ${filePath}`);
      }
    } catch (statError) {
      // File doesn't exist, which is fine - we'll create it
      if (statError instanceof Error && 'code' in statError) {
        const errorCode = (statError as NodeJS.ErrnoException).code;
        if (errorCode !== 'ENOENT') {
          throw statError;
        }
      }
    }

    // Write the file synchronously with UTF-8 encoding
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    // Re-throw with more descriptive error messages
    if (error instanceof Error) {
      if ('code' in error) {
        const errorCode = (error as NodeJS.ErrnoException).code;
        const errorPath = (error as NodeJS.ErrnoException).path;
        
        switch (errorCode) {
          case 'EACCES':
            throw new Error(`Permission denied: Cannot write to ${errorPath || filePath}`);
          case 'ENOSPC':
            throw new Error('No space left on device');
          case 'EROFS':
            throw new Error('Cannot write to read-only filesystem');
          case 'EISDIR':
            throw new Error(`Path is a directory, not a file: ${errorPath || filePath}`);
          case 'ENAMETOOLONG':
            throw new Error(`File path too long: ${errorPath || filePath}`);
          case 'ENOTDIR':
            throw new Error(`Parent path is not a directory: ${errorPath || filePath}`);
          default:
            throw new Error(`Failed to write file: ${error.message}`);
        }
      }
      // If it's already our custom error message, re-throw as is
      if (error.message.startsWith('Path is a directory') || 
          error.message.startsWith('Path contains null bytes')) {
        throw error;
      }
    }
    throw error;
  }
}