const value: string | undefined = 'abc';

export const ternaryStringFunctionExpressionCondNullishStringValueConst = function (): string {
    return value ?? '' ? 'then' : 'else';
};
