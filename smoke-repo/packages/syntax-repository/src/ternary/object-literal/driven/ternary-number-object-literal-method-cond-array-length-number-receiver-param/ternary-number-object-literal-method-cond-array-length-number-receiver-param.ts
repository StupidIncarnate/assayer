export const ternaryNumberObjectLiteralMethodCondArrayLengthNumberReceiverParam = {
    run(receiver: readonly number[]): string {
        return receiver.length ? 'then' : 'else';
    },
};
