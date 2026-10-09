const cond = process.env.COND ?? '';

export const ternaryStringIifeCondEnv = ((): string => {
    return cond ? 'then' : 'else';
})();
