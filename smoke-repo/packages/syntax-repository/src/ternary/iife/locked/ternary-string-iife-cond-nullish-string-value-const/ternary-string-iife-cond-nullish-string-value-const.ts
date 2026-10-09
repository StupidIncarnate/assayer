const value: string | undefined = 'abc';

export const ternaryStringIifeCondNullishStringValueConst = ((): string => {
    return value ?? '' ? 'then' : 'else';
})();
