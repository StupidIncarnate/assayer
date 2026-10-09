export const ifNumberArrowFunctionBlockBodyCondParam = (cond: number): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};
