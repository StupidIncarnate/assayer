export class TernaryNumberClassStaticMethodCondArrayLengthStringReceiverParam {
    public static run(receiver: readonly string[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
