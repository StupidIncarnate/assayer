export const ternaryBooleanFunctionExpressionCondEqNumberValueExternal = function (): string {
    return Number(process.argv[2]) === 7 ? 'then' : 'else';
};
