const value = process.env.VALUE ?? '';

export const ifBooleanIifeCondGtStringValueEnv = ((): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
})();
