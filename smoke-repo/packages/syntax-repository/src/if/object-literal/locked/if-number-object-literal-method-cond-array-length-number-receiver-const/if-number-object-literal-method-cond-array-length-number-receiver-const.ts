const receiver: readonly number[] = [10, 20, 30];

export const ifNumberObjectLiteralMethodCondArrayLengthNumberReceiverConst = {
    run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
