const cond: string = 'abc';

export const ifStringArrowFunctionBlockBodyCondConst = (): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};
