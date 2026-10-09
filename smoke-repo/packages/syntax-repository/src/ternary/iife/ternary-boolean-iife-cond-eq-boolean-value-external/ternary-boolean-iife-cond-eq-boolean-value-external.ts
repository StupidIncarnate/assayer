export const ternaryBooleanIifeCondEqBooleanValueExternal = ((): string => {
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
})();
