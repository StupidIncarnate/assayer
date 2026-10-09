const value: boolean | undefined = true;

export const ternaryBooleanIifeCondNullishBooleanValueConst = ((): string => {
    return value ?? false ? 'then' : 'else';
})();
