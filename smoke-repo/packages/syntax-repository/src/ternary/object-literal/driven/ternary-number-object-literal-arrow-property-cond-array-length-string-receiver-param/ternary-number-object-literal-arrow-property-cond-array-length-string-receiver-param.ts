export const ternaryNumberObjectLiteralArrowPropertyCondArrayLengthStringReceiverParam = {
    runArrow: (receiver: readonly string[]): string => {
        return receiver.length ? 'then' : 'else';
    },
};
