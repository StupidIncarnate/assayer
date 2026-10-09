const value = process.env.VALUE === 'true';

export const ifBooleanIifeCondEqBooleanValueEnv = ((): string => {
    if (value === false) {
        return 'then';
    }
    return 'else';
})();
