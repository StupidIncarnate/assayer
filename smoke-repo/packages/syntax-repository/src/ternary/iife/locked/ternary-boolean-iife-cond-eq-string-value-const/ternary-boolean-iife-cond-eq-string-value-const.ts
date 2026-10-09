const value: string = 'abc';

export const ternaryBooleanIifeCondEqStringValueConst = ((): string => {
    return value === 'xyz' ? 'then' : 'else';
})();
