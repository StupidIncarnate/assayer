export const ifNumberObjectLiteralMethodCondArrayLengthStringReceiverParam = {
    run(receiver: readonly string[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
