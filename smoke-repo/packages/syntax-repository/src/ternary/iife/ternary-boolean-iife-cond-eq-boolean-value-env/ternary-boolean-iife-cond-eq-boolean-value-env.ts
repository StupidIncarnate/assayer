const value = process.env.VALUE === 'true';

export const ternaryBooleanIifeCondEqBooleanValueEnv = ((): string => {
    return value === false ? 'then' : 'else';
})();
