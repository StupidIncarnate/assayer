const receiver: readonly string[] = ['a', 'b', 'c'];

export const ternaryNumberObjectLiteralArrowPropertyCondArrayLengthStringReceiverConst = {
    runArrow: (): string => {
        return receiver.length ? 'then' : 'else';
    },
};
