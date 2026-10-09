const cond: number = 3;

export const ifNumberArrowFunctionBlockBodyCondConst = (): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};
