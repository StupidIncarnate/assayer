const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

export const ifStringIifeCondNullishStringValueEnv = ((): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
})();
