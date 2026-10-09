export const ifStringFunctionExpressionCondExternal = function (): string {
    if (process.argv[2] ?? '') {
        return 'then';
    }
    return 'else';
};
