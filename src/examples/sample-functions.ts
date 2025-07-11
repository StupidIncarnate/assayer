/**
 * Sample functions for testing the JestTestStubGenerator
 */

// Simple arithmetic function
export function add(a: number, b: number): number {
  return a + b;
}

// String manipulation function
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Async function
export async function fetchData(endpoint: string): Promise<any> {
  const response = await fetch(endpoint);
  return response.json();
}

// Function with optional parameter
export function greet(name: string, title?: string): string {
  if (title) {
    return `Hello, ${title} ${name}!`;
  }
  return `Hello, ${name}!`;
}

// Function returning void
export function logMessage(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  console.log(`[${level.toUpperCase()}] ${message}`);
}

// Function with array parameter and return
export function filterPositive(numbers: number[]): number[] {
  return numbers.filter(n => n > 0);
}

// Function with complex types
export interface User {
  id: string;
  name: string;
  email: string;
}

export function createUser(name: string, email: string): User {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email
  };
}