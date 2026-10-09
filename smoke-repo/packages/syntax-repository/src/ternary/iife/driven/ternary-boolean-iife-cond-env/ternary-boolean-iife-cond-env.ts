const cond = process.env.COND === 'true';

export const ternaryBooleanIifeCondEnv = ((): string => {
    return cond ? 'then' : 'else';
})();
