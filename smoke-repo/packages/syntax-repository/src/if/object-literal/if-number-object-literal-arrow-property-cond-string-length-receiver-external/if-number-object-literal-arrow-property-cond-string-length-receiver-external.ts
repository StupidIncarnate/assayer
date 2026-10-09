export const ifNumberObjectLiteralArrowPropertyCondStringLengthReceiverExternal = {
    runArrow: (): string => {
        if ((process.argv[2] ?? '').length) {
            return 'then';
        }
        return 'else';
    },
};
