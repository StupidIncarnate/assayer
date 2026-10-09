const value: number = 3;

export const ifBooleanIifeCondNotNumberValueConst = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
