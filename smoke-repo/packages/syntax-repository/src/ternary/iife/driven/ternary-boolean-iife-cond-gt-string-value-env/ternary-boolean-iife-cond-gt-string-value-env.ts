const value = process.env.VALUE ?? '';

export const ternaryBooleanIifeCondGtStringValueEnv = ((): string => {
    return value > 'm' ? 'then' : 'else';
})();
