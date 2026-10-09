const value: string = 'abc';

export const ifBooleanIifeCondGtStringValueConst = ((): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
})();
