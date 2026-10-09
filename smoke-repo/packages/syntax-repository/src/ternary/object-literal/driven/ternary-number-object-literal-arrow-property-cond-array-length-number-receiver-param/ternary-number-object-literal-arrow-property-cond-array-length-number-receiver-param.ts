export const ternaryNumberObjectLiteralArrowPropertyCondArrayLengthNumberReceiverParam = {
    runArrow: (receiver: readonly number[]): string => {
        return receiver.length ? 'then' : 'else';
    },
};
