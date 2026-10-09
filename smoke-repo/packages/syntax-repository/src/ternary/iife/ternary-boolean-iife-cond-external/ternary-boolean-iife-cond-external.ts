export const ternaryBooleanIifeCondExternal = ((): string => {
    return process.argv[2] === 'yes' ? 'then' : 'else';
})();
