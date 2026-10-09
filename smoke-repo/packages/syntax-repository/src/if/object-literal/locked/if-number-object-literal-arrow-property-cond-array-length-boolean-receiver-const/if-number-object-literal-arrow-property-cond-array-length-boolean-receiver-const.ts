const receiver: readonly boolean[] = [true, false, true];

export const ifNumberObjectLiteralArrowPropertyCondArrayLengthBooleanReceiverConst = {
    runArrow: (): string => {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
