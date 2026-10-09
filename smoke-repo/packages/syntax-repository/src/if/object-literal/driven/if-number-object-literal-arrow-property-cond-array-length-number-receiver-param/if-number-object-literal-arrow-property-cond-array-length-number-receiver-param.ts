export const ifNumberObjectLiteralArrowPropertyCondArrayLengthNumberReceiverParam = {
    runArrow: (receiver: readonly number[]): string => {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
