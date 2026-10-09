export const ifNumberObjectLiteralArrowPropertyCondStringLengthReceiverParam = {
    runArrow: (receiver: string): string => {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
