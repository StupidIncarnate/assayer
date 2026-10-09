export const ternaryNumberObjectLiteralArrowPropertyCondArrayLengthBooleanReceiverParam = {
    runArrow: (receiver: readonly boolean[]): string => {
        return receiver.length ? 'then' : 'else';
    },
};
