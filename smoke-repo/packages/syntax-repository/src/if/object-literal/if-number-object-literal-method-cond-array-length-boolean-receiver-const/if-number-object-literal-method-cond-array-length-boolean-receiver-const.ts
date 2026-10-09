const receiver: readonly boolean[] = [true, false, true];

export const ifNumberObjectLiteralMethodCondArrayLengthBooleanReceiverConst = {
    run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
