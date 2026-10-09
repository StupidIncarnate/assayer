const value: number = 3;

export const ifBooleanIifeCondEqNumberValueConst = ((): string => {
    if (value === 7) {
        return 'then';
    }
    return 'else';
})();
