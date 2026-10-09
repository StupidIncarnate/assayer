const cond: number = 3;

export const ifNumberIifeCondConst = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
