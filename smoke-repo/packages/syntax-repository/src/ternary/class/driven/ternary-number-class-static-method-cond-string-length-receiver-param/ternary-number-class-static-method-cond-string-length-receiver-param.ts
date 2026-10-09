export class TernaryNumberClassStaticMethodCondStringLengthReceiverParam {
    public static run(receiver: string): string {
        return receiver.length ? 'then' : 'else';
    }
}
