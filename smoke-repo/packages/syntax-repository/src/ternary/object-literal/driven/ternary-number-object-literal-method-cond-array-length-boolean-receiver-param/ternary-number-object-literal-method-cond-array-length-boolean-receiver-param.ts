export const ternaryNumberObjectLiteralMethodCondArrayLengthBooleanReceiverParam = {
    run(receiver: readonly boolean[]): string {
        return receiver.length ? 'then' : 'else';
    },
};
