const value: string | undefined = 'abc';

export const ternaryStringObjectLiteralPropertyCondNullishStringValueConst = {
    label: value ?? '' ? 'then' : 'else',
};
