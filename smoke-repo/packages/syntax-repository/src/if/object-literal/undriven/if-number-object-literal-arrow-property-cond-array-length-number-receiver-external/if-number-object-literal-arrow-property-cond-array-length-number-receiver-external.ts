export const ifNumberObjectLiteralArrowPropertyCondArrayLengthNumberReceiverExternal = {
    runArrow: (): string => {
        if (process.argv.slice(2).map(Number).length) {
            return 'then';
        }
        return 'else';
    },
};
