const cond = Number(process.env.COND);

export const ifNumberIifeCondEnv = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
