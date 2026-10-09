export const ternaryNumberArrowFunctionExpressionBodyCondNullishNumberValueExternal = (): string => (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else';
