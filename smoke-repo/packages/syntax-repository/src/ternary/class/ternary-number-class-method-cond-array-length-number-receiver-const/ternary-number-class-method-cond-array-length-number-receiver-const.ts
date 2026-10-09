const receiver: readonly number[] = [10, 20, 30];

export class TernaryNumberClassMethodCondArrayLengthNumberReceiverConst {
    public run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
