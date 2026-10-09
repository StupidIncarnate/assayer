const cond: boolean = true;

export const ifBooleanArrowFunctionBlockBodyCondConst = (): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};
