const value = process.env.VALUE ?? '';

export const ifBooleanIifeCondNotStringValueEnv = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
