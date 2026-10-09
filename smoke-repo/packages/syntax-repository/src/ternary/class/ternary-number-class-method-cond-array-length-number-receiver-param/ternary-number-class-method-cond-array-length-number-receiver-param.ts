export class TernaryNumberClassMethodCondArrayLengthNumberReceiverParam {
    public run(receiver: readonly number[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
