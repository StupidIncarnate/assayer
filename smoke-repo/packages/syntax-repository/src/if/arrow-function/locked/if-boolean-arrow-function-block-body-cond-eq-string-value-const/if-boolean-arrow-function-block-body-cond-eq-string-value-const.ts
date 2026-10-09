const value: string = 'abc';

export const ifBooleanArrowFunctionBlockBodyCondEqStringValueConst = (): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};
