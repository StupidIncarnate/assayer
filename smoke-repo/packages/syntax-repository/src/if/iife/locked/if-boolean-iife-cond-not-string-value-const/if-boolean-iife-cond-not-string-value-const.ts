const value: string = 'abc';

export const ifBooleanIifeCondNotStringValueConst = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
