export const ternaryStringIifeCondExternal = ((): string => {
    return process.argv[2] ?? '' ? 'then' : 'else';
})();
