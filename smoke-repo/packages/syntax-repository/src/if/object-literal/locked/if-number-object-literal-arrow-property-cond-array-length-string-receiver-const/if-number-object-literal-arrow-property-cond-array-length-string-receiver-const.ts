const receiver: readonly string[] = ['a', 'b', 'c'];

export const ifNumberObjectLiteralArrowPropertyCondArrayLengthStringReceiverConst = {
    runArrow: (): string => {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
