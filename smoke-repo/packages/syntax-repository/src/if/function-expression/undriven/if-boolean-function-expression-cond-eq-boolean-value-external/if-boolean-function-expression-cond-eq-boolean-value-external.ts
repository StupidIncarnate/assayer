export const ifBooleanFunctionExpressionCondEqBooleanValueExternal = function (): string {
    if (process.argv[2] === 'yes' === false) {
        return 'then';
    }
    return 'else';
};
