const receiver: string = 'abc';

export const ifNumberObjectLiteralArrowPropertyCondStringLengthReceiverConst = {
    runArrow: (): string => {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
