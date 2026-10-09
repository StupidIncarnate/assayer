const receiver: readonly boolean[] = [true, false, true];

export const ternaryNumberObjectLiteralArrowPropertyCondArrayLengthBooleanReceiverConst = {
    runArrow: (): string => {
        return receiver.length ? 'then' : 'else';
    },
};
