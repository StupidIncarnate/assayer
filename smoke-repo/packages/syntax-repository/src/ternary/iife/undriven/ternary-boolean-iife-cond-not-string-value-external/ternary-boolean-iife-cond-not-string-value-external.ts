export const ternaryBooleanIifeCondNotStringValueExternal = ((): string => {
    return !(process.argv[2] ?? '') ? 'then' : 'else';
})();
