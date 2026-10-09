export const ifNumberArrowFunctionBlockBodyCondArrayLengthBooleanReceiverExternal = (): string => {
    if (process.argv.slice(2).map(arg => arg === 'yes').length) {
        return 'then';
    }
    return 'else';
};
