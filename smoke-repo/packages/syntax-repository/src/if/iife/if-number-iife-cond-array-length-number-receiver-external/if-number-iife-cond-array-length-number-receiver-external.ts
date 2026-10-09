export const ifNumberIifeCondArrayLengthNumberReceiverExternal = ((): string => {
    if (process.argv.slice(2).map(Number).length) {
        return 'then';
    }
    return 'else';
})();
