const value: number = 3;

export const ifBooleanFunctionExpressionCondNotNumberValueConst = function (): string {
    if (!value) {
        return 'then';
    }
    return 'else';
};
