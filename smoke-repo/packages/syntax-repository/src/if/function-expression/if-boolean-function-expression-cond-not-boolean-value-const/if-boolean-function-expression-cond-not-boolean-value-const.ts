const value: boolean = true;

export const ifBooleanFunctionExpressionCondNotBooleanValueConst = function (): string {
    if (!value) {
        return 'then';
    }
    return 'else';
};
