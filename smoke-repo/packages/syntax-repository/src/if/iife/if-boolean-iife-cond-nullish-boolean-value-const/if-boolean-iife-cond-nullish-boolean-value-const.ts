const value: boolean | undefined = true;

export const ifBooleanIifeCondNullishBooleanValueConst = ((): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
})();
