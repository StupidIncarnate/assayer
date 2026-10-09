export const ifNumberObjectLiteralArrowPropertyCondArrayLengthStringReceiverExternal = {
    runArrow: (): string => {
        if (process.argv.slice(2).length) {
            return 'then';
        }
        return 'else';
    },
};
