export const ternaryStringArrowFunctionExpressionBodyCondExternal = (): string => process.argv[2] ?? '' ? 'then' : 'else';
