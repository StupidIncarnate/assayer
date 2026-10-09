const receiver: string = 'abc';

export const ifNumberObjectLiteralMethodCondStringLengthReceiverConst = {
    run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
