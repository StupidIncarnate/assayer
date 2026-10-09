const value = process.env.VALUE ?? '';

export const ternaryBooleanIifeCondNotStringValueEnv = ((): string => {
    return !value ? 'then' : 'else';
})();
