const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

export const ternaryBooleanIifeCondNullishBooleanValueEnv = ((): string => {
    return value ?? false ? 'then' : 'else';
})();
