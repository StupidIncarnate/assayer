export const ifNumberArrowFunctionBlockBodyCondArrayLengthStringReceiverExternal = (): string => {
    if (process.argv.slice(2).length) {
        return 'then';
    }
    return 'else';
};
