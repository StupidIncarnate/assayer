const value: string = 'abc';

export const ifBooleanIifeCondEqStringValueConst = ((): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
})();
