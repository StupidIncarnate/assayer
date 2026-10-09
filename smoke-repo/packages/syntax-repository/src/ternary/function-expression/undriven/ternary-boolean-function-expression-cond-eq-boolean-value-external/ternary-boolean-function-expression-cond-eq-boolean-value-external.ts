export const ternaryBooleanFunctionExpressionCondEqBooleanValueExternal = function (): string {
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
};
