export const ternaryNumberIifeCondStringLengthReceiverExternal = ((): string => {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
})();
