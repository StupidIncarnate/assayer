const receiver: readonly number[] = [10, 20, 30];

export const ifNumberObjectLiteralArrowPropertyCondArrayLengthNumberReceiverConst = {
    runArrow: (): string => {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
