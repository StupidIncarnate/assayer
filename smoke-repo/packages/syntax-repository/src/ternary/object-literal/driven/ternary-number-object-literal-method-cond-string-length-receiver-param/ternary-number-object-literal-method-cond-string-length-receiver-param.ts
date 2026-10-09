export const ternaryNumberObjectLiteralMethodCondStringLengthReceiverParam = {
    run(receiver: string): string {
        return receiver.length ? 'then' : 'else';
    },
};
