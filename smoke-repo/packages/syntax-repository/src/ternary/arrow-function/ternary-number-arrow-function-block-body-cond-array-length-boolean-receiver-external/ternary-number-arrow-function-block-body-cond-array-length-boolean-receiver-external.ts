export const ternaryNumberArrowFunctionBlockBodyCondArrayLengthBooleanReceiverExternal = (): string => {
    return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
};
