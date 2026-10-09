export const ternaryBooleanIifeCondEqStringValueExternal = ((): string => {
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
})();
