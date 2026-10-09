const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

export const ifBooleanIifeCondNullishBooleanValueEnv = ((): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
})();
