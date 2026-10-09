const value: number | undefined = 3;

export const ternaryNumberFunctionExpressionCondNullishNumberValueConst = function (): string {
    return value ?? 0 ? 'then' : 'else';
};
