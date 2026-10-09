const value: string = 'abc';

export const ternaryBooleanIifeCondNotStringValueConst = ((): string => {
    return !value ? 'then' : 'else';
})();
