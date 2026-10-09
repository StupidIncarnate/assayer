const value = process.env.VALUE ?? '';

export const ternaryBooleanIifeCondEqStringValueEnv = ((): string => {
    return value === 'xyz' ? 'then' : 'else';
})();
