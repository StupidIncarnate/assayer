export const ternaryNumberObjectLiteralArrowPropertyCondArrayLengthStringReceiverExternal = {
    runArrow: (): string => {
        return process.argv.slice(2).length ? 'then' : 'else';
    },
};
