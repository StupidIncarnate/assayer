export const ternaryNumberObjectLiteralArrowPropertyCondStringLengthReceiverParam = {
    runArrow: (receiver: string): string => {
        return receiver.length ? 'then' : 'else';
    },
};
