const value: number | undefined = 3;

export const ternaryNumberIifeCondNullishNumberValueConst = ((): string => {
    return value ?? 0 ? 'then' : 'else';
})();
