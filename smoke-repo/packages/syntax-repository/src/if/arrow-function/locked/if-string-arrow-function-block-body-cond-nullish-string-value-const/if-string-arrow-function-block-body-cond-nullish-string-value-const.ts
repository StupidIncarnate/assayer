const value: string | undefined = 'abc';

export const ifStringArrowFunctionBlockBodyCondNullishStringValueConst = (): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};
