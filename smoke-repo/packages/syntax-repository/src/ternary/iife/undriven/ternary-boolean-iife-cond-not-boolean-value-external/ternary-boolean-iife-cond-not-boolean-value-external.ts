export const ternaryBooleanIifeCondNotBooleanValueExternal = ((): string => {
    return !(process.argv[2] === 'yes') ? 'then' : 'else';
})();
