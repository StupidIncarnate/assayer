const value = process.env.VALUE === 'true';

export const ternaryBooleanIifeCondNotBooleanValueEnv = ((): string => {
    return !value ? 'then' : 'else';
})();
