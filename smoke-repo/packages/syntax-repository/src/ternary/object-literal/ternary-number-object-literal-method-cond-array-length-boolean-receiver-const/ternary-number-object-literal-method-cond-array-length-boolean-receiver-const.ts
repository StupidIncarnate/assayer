const receiver: readonly boolean[] = [true, false, true];

export const ternaryNumberObjectLiteralMethodCondArrayLengthBooleanReceiverConst = {
    run(): string {
        return receiver.length ? 'then' : 'else';
    },
};
