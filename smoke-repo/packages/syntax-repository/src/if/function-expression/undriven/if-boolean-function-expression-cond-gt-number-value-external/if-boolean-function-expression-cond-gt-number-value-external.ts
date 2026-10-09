export const ifBooleanFunctionExpressionCondGtNumberValueExternal = function (): string {
    if (Number(process.argv[2]) > 5) {
        return 'then';
    }
    return 'else';
};
