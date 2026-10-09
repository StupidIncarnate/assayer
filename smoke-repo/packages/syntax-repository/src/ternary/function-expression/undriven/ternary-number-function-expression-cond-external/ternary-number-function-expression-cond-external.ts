export const ternaryNumberFunctionExpressionCondExternal = function (): string {
    return Number(process.argv[2]) ? 'then' : 'else';
};
