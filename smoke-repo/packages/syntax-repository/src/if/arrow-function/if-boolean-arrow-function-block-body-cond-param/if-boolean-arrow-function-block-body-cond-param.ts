export const ifBooleanArrowFunctionBlockBodyCondParam = (cond: boolean): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};
