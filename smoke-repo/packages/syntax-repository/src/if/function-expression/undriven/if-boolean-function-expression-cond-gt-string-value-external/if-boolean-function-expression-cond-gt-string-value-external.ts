export const ifBooleanFunctionExpressionCondGtStringValueExternal = function (): string {
    if ((process.argv[2] ?? '') > 'm') {
        return 'then';
    }
    return 'else';
};
