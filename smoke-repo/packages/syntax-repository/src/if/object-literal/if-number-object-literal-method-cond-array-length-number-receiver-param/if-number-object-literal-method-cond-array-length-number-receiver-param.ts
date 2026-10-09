export const ifNumberObjectLiteralMethodCondArrayLengthNumberReceiverParam = {
    run(receiver: readonly number[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
