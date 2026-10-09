const value: string | undefined = 'abc';

export const ternaryStringArrowFunctionBlockBodyCondNullishStringValueConst = (): string => {
    return value ?? '' ? 'then' : 'else';
};
