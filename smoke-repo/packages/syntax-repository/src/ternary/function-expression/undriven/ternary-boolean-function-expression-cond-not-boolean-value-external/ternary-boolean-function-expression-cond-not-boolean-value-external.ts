export const ternaryBooleanFunctionExpressionCondNotBooleanValueExternal = function (): string {
    return !(process.argv[2] === 'yes') ? 'then' : 'else';
};
