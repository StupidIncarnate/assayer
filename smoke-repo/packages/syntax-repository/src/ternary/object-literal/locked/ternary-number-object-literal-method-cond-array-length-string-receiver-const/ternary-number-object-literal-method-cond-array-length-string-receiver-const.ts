const receiver: readonly string[] = ['a', 'b', 'c'];

export const ternaryNumberObjectLiteralMethodCondArrayLengthStringReceiverConst = {
    run(): string {
        return receiver.length ? 'then' : 'else';
    },
};
