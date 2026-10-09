export const ifBooleanArrowFunctionBlockBodyCondEqStringValueParam = (value: string): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};
