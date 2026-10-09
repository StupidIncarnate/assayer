export const ternaryStringFunctionExpressionCondExternal = function (): string {
    return process.argv[2] ?? '' ? 'then' : 'else';
};
