const cond: boolean = true;

export const ifBooleanIifeCondConst = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
