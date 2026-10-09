export const ternaryNumberObjectLiteralMethodCondArrayLengthStringReceiverParam = {
    run(receiver: readonly string[]): string {
        return receiver.length ? 'then' : 'else';
    },
};
