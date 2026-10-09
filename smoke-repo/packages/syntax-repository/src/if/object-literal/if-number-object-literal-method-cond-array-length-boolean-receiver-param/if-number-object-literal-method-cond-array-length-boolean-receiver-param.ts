export const ifNumberObjectLiteralMethodCondArrayLengthBooleanReceiverParam = {
    run(receiver: readonly boolean[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
