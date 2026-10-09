const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);

export const ternaryNumberObjectLiteralPropertyCondArrayLengthNumberReceiverEnv = {
    label: receiver.length ? 'then' : 'else',
};
