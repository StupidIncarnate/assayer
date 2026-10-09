const cond = process.env.COND ?? '';

export const ifStringIifeCondEnv = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
