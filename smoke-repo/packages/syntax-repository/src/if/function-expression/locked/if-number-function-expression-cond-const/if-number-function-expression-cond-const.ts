const cond: number = 3;

export const ifNumberFunctionExpressionCondConst = function (): string {
    if (cond) {
        return 'then';
    }
    return 'else';
};
