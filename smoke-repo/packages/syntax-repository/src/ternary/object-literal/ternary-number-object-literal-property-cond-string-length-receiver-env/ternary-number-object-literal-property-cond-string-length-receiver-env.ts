const receiver = process.env.RECEIVER ?? '';

export const ternaryNumberObjectLiteralPropertyCondStringLengthReceiverEnv = {
    label: receiver.length ? 'then' : 'else',
};
