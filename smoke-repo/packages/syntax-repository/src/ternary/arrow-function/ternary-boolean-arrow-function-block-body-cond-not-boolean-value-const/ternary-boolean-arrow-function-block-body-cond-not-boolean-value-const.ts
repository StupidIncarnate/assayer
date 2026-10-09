const value: boolean = true;

export const ternaryBooleanArrowFunctionBlockBodyCondNotBooleanValueConst = (): string => {
    return !value ? 'then' : 'else';
};
