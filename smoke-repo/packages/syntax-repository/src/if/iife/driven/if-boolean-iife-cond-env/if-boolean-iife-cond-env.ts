const cond = process.env.COND === 'true';

export const ifBooleanIifeCondEnv = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
