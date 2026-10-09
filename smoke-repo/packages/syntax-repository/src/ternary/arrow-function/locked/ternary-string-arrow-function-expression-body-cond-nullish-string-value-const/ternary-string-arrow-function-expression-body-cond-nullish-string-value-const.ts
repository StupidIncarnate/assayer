const value: string | undefined = 'abc';

export const ternaryStringArrowFunctionExpressionBodyCondNullishStringValueConst = (): string => value ?? '' ? 'then' : 'else';
