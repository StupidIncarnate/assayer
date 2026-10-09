const receiver: readonly number[] = [10, 20, 30];

export class TernaryNumberClassGetterCondArrayLengthNumberReceiverConst {
    public get result(): string {
        return receiver.length ? 'then' : 'else';
    }
}
