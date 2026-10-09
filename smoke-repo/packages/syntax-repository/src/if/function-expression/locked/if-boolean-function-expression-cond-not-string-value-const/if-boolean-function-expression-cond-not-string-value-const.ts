const value: string = 'abc';

export const ifBooleanFunctionExpressionCondNotStringValueConst = function (): string {
    if (!value) {
        return 'then';
    }
    return 'else';
};
