export class TernaryNumberClassMethodCondArrayLengthStringReceiverParam {
    public run(receiver: readonly string[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
