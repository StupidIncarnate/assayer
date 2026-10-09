const receiver = (process.env.RECEIVER ?? '').split(',').map(item => item === 'true');

export class TernaryNumberClassStaticFieldCondArrayLengthBooleanReceiverEnv {
    public static label = receiver.length ? 'then' : 'else';
}
