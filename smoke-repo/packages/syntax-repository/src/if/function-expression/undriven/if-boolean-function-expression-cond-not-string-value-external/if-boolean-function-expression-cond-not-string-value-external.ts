export const ifBooleanFunctionExpressionCondNotStringValueExternal = function (): string {
    if (!(process.argv[2] ?? '')) {
        return 'then';
    }
    return 'else';
};
