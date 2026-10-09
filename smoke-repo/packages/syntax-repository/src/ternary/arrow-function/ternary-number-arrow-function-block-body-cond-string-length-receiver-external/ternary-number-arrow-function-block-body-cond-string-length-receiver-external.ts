export const ternaryNumberArrowFunctionBlockBodyCondStringLengthReceiverExternal = (): string => {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
};
