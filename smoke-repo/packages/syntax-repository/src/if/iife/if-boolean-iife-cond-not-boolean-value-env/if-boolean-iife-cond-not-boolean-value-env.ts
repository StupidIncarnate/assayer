const value = process.env.VALUE === 'true';

export const ifBooleanIifeCondNotBooleanValueEnv = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
