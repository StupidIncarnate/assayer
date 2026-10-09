const value: boolean = true;

export const ifBooleanIifeCondNotBooleanValueConst = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
