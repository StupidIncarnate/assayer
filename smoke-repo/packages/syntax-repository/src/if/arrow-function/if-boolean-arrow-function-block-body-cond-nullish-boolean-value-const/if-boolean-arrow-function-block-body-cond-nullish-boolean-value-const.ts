const value: boolean | undefined = true;

export const ifBooleanArrowFunctionBlockBodyCondNullishBooleanValueConst = (): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};
