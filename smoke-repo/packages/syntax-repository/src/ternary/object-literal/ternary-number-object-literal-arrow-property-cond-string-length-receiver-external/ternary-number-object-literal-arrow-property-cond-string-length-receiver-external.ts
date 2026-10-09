export const ternaryNumberObjectLiteralArrowPropertyCondStringLengthReceiverExternal = {
    runArrow: (): string => {
        return (process.argv[2] ?? '').length ? 'then' : 'else';
    },
};
