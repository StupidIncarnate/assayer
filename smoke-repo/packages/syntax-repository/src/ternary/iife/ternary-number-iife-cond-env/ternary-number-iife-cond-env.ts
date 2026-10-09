const cond = Number(process.env.COND);

export const ternaryNumberIifeCondEnv = ((): string => {
    return cond ? 'then' : 'else';
})();
