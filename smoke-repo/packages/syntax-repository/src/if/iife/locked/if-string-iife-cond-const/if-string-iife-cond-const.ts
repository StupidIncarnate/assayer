const cond: string = 'abc';

export const ifStringIifeCondConst = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
