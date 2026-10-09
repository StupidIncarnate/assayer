const value: string | undefined = 'abc';

export const ifStringIifeCondNullishStringValueConst = ((): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
})();
