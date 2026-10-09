const value: string = 'abc';

export const ternaryBooleanArrowFunctionBlockBodyCondNotStringValueConst = (): string => {
    return !value ? 'then' : 'else';
};
