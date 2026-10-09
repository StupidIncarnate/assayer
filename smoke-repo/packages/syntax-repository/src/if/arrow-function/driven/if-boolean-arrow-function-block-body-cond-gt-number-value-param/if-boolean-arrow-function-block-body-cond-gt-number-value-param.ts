export const ifBooleanArrowFunctionBlockBodyCondGtNumberValueParam = (value: number): string => {
    if (value > 5) {
        return 'then';
    }
    return 'else';
};
