const value: number = 3;

export const ifBooleanFunctionExpressionCondGtNumberValueConst = function (): string {
    if (value > 5) {
        return 'then';
    }
    return 'else';
};
