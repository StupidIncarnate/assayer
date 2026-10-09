const value: boolean = true;

export const ternaryBooleanIifeCondNotBooleanValueConst = ((): string => {
    return !value ? 'then' : 'else';
})();
