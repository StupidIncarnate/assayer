const receiver = process.env.RECEIVER ?? '';

export class TernaryNumberClassStaticFieldCondStringLengthReceiverEnv {
    public static label = receiver.length ? 'then' : 'else';
}
