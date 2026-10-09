export const ternaryBooleanObjectLiteralPropertyCondNullishBooleanValueExternal = {
    label: (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else',
};
