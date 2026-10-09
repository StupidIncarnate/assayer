export const ifBooleanFunctionExpressionCondNotBooleanValueExternal = function (): string {
    if (!(process.argv[2] === 'yes')) {
        return 'then';
    }
    return 'else';
};
