export const ifStringArrowFunctionBlockBodyCondParam = (cond: string): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};
