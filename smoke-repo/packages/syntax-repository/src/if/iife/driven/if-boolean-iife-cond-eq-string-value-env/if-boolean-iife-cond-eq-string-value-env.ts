const value = process.env.VALUE ?? '';

export const ifBooleanIifeCondEqStringValueEnv = ((): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
})();
