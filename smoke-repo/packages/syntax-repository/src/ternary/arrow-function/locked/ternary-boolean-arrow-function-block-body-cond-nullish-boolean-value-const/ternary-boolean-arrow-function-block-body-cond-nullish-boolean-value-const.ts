const value: boolean | undefined = true;

export const ternaryBooleanArrowFunctionBlockBodyCondNullishBooleanValueConst = (): string => {
    return value ?? false ? 'then' : 'else';
};
