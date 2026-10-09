export class TernaryNumberClassMethodCondArrayLengthBooleanReceiverParam {
    public run(receiver: readonly boolean[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
