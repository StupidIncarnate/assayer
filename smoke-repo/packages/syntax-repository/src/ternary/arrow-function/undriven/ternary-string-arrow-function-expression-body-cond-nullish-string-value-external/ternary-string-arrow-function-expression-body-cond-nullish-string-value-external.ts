export const ternaryStringArrowFunctionExpressionBodyCondNullishStringValueExternal = (): string => (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
