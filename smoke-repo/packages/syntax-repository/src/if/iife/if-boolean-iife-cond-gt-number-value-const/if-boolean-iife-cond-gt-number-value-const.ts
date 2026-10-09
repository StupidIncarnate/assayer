const value: number = 3;

export const ifBooleanIifeCondGtNumberValueConst = ((): string => {
    if (value > 5) {
        return 'then';
    }
    return 'else';
})();
