const receiver = (process.env.RECEIVER ?? '').split(',').map(item => item === 'true');

export const ternaryNumberObjectLiteralPropertyCondArrayLengthBooleanReceiverEnv = {
    label: receiver.length ? 'then' : 'else',
};
