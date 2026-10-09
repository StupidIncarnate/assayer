const receiver: readonly string[] = ['a', 'b', 'c'];

export const ifNumberObjectLiteralMethodCondArrayLengthStringReceiverConst = {
    run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
