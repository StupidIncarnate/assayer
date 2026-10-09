export const ternaryBooleanFunctionExpressionCondGtNumberValueExternal = function (): string {
    return Number(process.argv[2]) > 5 ? 'then' : 'else';
};
