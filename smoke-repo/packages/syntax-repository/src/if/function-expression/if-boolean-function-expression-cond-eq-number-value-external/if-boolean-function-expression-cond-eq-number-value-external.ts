export const ifBooleanFunctionExpressionCondEqNumberValueExternal = function (): string {
    if (Number(process.argv[2]) === 7) {
        return 'then';
    }
    return 'else';
};
