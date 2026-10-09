const value: number | undefined = 3;

export const ifNumberArrowFunctionBlockBodyCondNullishNumberValueConst = (): string => {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
};
