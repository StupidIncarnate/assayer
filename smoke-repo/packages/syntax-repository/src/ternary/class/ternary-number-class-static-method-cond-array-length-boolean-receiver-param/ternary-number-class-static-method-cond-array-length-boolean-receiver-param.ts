export class TernaryNumberClassStaticMethodCondArrayLengthBooleanReceiverParam {
    public static run(receiver: readonly boolean[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
