const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);

export class TernaryNumberClassStaticFieldCondArrayLengthNumberReceiverEnv {
    public static label = receiver.length ? 'then' : 'else';
}
