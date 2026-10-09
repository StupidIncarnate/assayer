export const ifNumberObjectLiteralMethodCondStringLengthReceiverParam = {
    run(receiver: string): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
