export class TernaryNumberClassStaticMethodCondArrayLengthNumberReceiverParam {
    public static run(receiver: readonly number[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
