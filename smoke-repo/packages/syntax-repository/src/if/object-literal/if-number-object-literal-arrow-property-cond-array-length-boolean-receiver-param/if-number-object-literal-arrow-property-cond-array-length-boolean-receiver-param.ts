export const ifNumberObjectLiteralArrowPropertyCondArrayLengthBooleanReceiverParam = {
    runArrow: (receiver: readonly boolean[]): string => {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
